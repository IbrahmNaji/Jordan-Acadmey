// Phase 1 smoke test: runs against a real database with throwaway fixtures
// (created and removed by this script). Never run against production.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(serverDir, '.env') });

const smokeDatabaseUrl=(process.env.SMOKE_DATABASE_URL||'').trim();
const configuredDatabaseUrl=(process.env.DATABASE_URL||'').trim();
let smokeDatabaseName='';
try{smokeDatabaseName=decodeURIComponent(new URL(smokeDatabaseUrl).pathname.slice(1));}catch{}
if(!smokeDatabaseUrl||smokeDatabaseUrl===configuredDatabaseUrl||!/(?:_test|_smoke)$/i.test(smokeDatabaseName)){console.error('Refusing smoke test: set SMOKE_DATABASE_URL to a separate database whose name ends in _test or _smoke.');process.exit(1);}
process.env.DATABASE_URL=smokeDatabaseUrl;


const PORT = Number(process.env.SMOKE_PORT || 4199);
const BASE = `http://127.0.0.1:${PORT}/api`;
const PASSWORD = `Smoke-${randomBytes(9).toString('base64url')}1`;
const NEW_PASSWORD = `Smoke-${randomBytes(9).toString('base64url')}2`;

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run smoke fixtures with NODE_ENV=production');
  process.exit(1);
}

const prisma = new PrismaClient();
const createdUserIds = [];
const createdLeadIds = [];
const createdCustomerIds = [];
const createdCourseIds = [];
const createdBatchIds = [];
const createdEnrollmentIds = [];
const createdVehicleIds = [];
const createdDealIds = [];
const createdWorkshopRequestIds = [];
const createdPartsRequestIds = [];
const preservedSmokeSourceIds = new Set();
let smokeMaskedEmail = null;
let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function api(method, url, { token, body, rawBody } = {}) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      ...(body !== undefined || rawBody !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body:
      rawBody !== undefined
        ? rawBody
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, data };
}

async function makeUser(role, label) {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.create({
    data: {
      email: `smoke.${label}.${randomBytes(4).toString('hex')}@test.local`,
      fullName: `Smoke ${label}`,
      role,
      passwordHash,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

async function login(email, password) {
  return api('POST', '/auth/login', { body: { email, password } });
}

async function main() {
  console.log(`Starting server on ${PORT} ...`);
  const child = spawn(process.execPath, ['dist/server.js'], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  child.stdout.on('data', (d) => (serverLog += d));
  child.stderr.on('data', (d) => (serverLog += d));

  try {
    let ready = false;
    for (let i = 0; i < 40; i += 1) {
      try {
        const res = await fetch(`${BASE}/health`);
        if (res.ok) {
          ready = true;
          break;
        }
      } catch {
        /* retry */
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) throw new Error(`Server did not start:\n${serverLog}`);

    console.log('\nFixtures');
    const existingPublicSources = await prisma.campaignSource.findMany({ where: { name: { in: ['الموقع الإلكتروني', 'استفسار سوق المركبات'] } }, select: { id: true } });
    for (const source of existingPublicSources) preservedSmokeSourceIds.add(source.id);

    const unlinkedBefore = await prisma.lead.count({ where: { customerId: null } });
    check(
      'pre-existing leads are linked to customers',
      unlinkedBefore === 0,
      `${unlinkedBefore} unlinked`,
    );
    const admin = await makeUser('ADMIN', 'admin');
    const manager = await makeUser('MANAGER', 'manager');
    const agent = await makeUser('AGENT', 'agent');
    smokeMaskedEmail = `${admin.email.slice(0, 1)}***@${admin.email.split('@')[1]}`;
    console.log(`  created ${createdUserIds.length} throwaway users`);

    console.log('\nAuth');
    const health = await api('GET', '/health');
    check('health responds 200', health.status === 200, `status ${health.status}`);

    const adminLogin = await login(admin.email, PASSWORD);
    check('admin login 200', adminLogin.status === 200, `status ${adminLogin.status}`);
    const adminToken = adminLogin.data?.accessToken;

    const managerLogin = await login(manager.email, PASSWORD);
    const managerToken = managerLogin.data?.accessToken;
    check('manager login 200', managerLogin.status === 200);

    const agentLogin = await login(agent.email, PASSWORD);
    const agentToken = agentLogin.data?.accessToken;
    check('agent login 200', agentLogin.status === 200);

    const badLogin = await login(admin.email, 'definitely-wrong-password');
    check('wrong password rejected 401', badLogin.status === 401, `status ${badLogin.status}`);
    check('agent cannot read users', (await api('GET', '/users', { token: agentToken })).status === 403);
    check('manager cannot create users', (await api('POST', '/users', { token: managerToken, body: { fullName: 'X Y', email: 'x@test.local', role: 'AGENT', password: 'Abcdefgh12' } })).status === 403);

    const me = await api('GET', '/auth/me', { token: agentToken });
    check('/auth/me returns caller', me.status === 200 && me.data?.id === agent.id);

    console.log('\nLeads: record-level access');
    const managerLead = await prisma.lead.create({
      data: { fullName: 'Smoke Manager Lead', phone: '0900000001', assignedToId: manager.id },
    });
    createdLeadIds.push(managerLead.id);
    const agentLead = await prisma.lead.create({
      data: { fullName: 'Smoke Agent Lead', phone: '0900000002', assignedToId: agent.id },
    });
    createdLeadIds.push(agentLead.id);

    const crossRead = await api('GET', `/leads/${managerLead.id}`, { token: agentToken });
    check('agent gets 404 on foreign lead', crossRead.status === 404, `status ${crossRead.status}`);
    const crossPatch = await api('PATCH', `/leads/${managerLead.id}`, {
      token: agentToken,
      body: { fullName: 'Hijacked' },
    });
    check('agent cannot patch foreign lead', crossPatch.status === 404, `status ${crossPatch.status}`);

    const list = await api('GET', '/leads?pageSize=100', { token: agentToken });
    const listed = Array.isArray(list.data?.items) ? list.data.items : [];
    check('agent list only own leads', list.status === 200 && listed.every((l) => l.assignedToId === agent.id), JSON.stringify(list.data).slice(0, 160));

    const massAssign = await api('POST', '/leads', {
      token: agentToken,
      body: { fullName: 'Smoke Forged Assign', phone: '0900000003', assignedToId: manager.id },
    });
    if (massAssign.status === 201) {
      createdLeadIds.push(massAssign.data.id);
      if (massAssign.data.customerId) createdCustomerIds.push(massAssign.data.customerId);
    }
    check('agent-created lead is self-assigned', massAssign.status === 201 && massAssign.data?.assignedToId === agent.id, `status ${massAssign.status}`);

    const unknownField = await api('PATCH', `/leads/${agentLead.id}`, {
      token: agentToken,
      body: { status: 'LOST' },
    });
    check('update rejects status field', unknownField.status === 400, `status ${unknownField.status}`);

    console.log('\nFollow-up set and clear');
    const setFollowUp = await api('PATCH', `/leads/${agentLead.id}/follow-up`, {
      token: agentToken,
      body: { nextFollowUpAt: '2026-11-02T10:00:00.000Z' },
    });
    check('follow-up set 200', setFollowUp.status === 200 && setFollowUp.data?.nextFollowUpAt?.startsWith('2026-11-02'), `status ${setFollowUp.status}`);
    const clearFollowUp = await api('PATCH', `/leads/${agentLead.id}/follow-up`, {
      token: agentToken,
      body: { nextFollowUpAt: null },
    });
    check('follow-up clear 200 and null', clearFollowUp.status === 200 && clearFollowUp.data?.nextFollowUpAt === null, `status ${clearFollowUp.status} value ${JSON.stringify(clearFollowUp.data?.nextFollowUpAt)}`);
    const invalidDate = await api('PATCH', `/leads/${agentLead.id}/follow-up`, {
      token: agentToken,
      body: { nextFollowUpAt: 'not-a-date' },
    });
    check('invalid follow-up date rejected 400', invalidDate.status === 400, `status ${invalidDate.status}`);

    console.log('\nEnrollments');
    const enrollmentList = await api('GET', '/enrollments?page=1&pageSize=5', { token: adminToken });
    const expectedCollected = await prisma.payment.aggregate({
      where: { enrollment: { status: { not: 'CANCELLED' } } },
      _sum: { amount: true },
    });
    check(
      'enrollments list shape',
      enrollmentList.status === 200 &&
        Array.isArray(enrollmentList.data?.items) &&
        typeof enrollmentList.data?.total === 'number' &&
        Number.isFinite(Number(enrollmentList.data?.summary?.collected)),
      `status ${enrollmentList.status} keys ${Object.keys(enrollmentList.data ?? {}).join(',')}`,
    );
    check(
      'enrollments summary matches database',
      Math.abs(
        Number(enrollmentList.data?.summary?.collected) -
          Number(expectedCollected._sum.amount ?? 0),
      ) < 0.005,
      `api ${enrollmentList.data?.summary?.collected} db ${expectedCollected._sum.amount}`,
    );
    const pageClamp = await api('GET', '/enrollments?pageSize=500', { token: adminToken });
    check('pageSize above max rejected', pageClamp.status === 400, `status ${pageClamp.status}`);
    const existingEnrollment = await prisma.enrollment.findFirst({ select: { id: true } });
    if (existingEnrollment) {
      const agentStatusPatch = await api('PATCH', `/enrollments/${existingEnrollment.id}`, {
        token: agentToken,
        body: { status: 'COMPLETED' },
      });
      check('agent cannot manage enrollment terms', agentStatusPatch.status === 403, `status ${agentStatusPatch.status}`);
    } else {
      console.log('  --  no enrollment present; skipped agent PATCH check');
    }

    console.log('\nAcademy catalog and administration');
    for (let i = 0; i < 4; i += 1) {
      const fixture = await prisma.course.create({
        data: {
          slug: 'smoke-public-' + randomBytes(4).toString('hex'),
          title: 'Smoke Public Course ' + i, shortTitle: 'Smoke ' + i, courseType: 'MECHANICS',
          tagline: 'Smoke fixture', summary: 'Temporary isolated smoke fixture.',
          description: ['Smoke fixture'], focus: [], format: 'Onsite', note: 'Temporary',
          image: '/images/courses/mechanics.jpg', imageAlt: 'Smoke fixture', status: 'PUBLISHED',
        },
        select: { id: true },
      });
      createdCourseIds.push(fixture.id);
    }
    const publicCourses = await api('GET', '/public/courses');
    const publicList = Array.isArray(publicCourses.data?.items)
      ? publicCourses.data.items
      : [];
    check(
      'public catalog served from database',
      publicCourses.status === 200 && publicList.length >= 4,
      `status ${publicCourses.status} count ${publicList.length}`,
    );
    check(
      'public catalog exposes no internal fields',
      publicList.length > 0 &&
        publicList.every(
          (course) =>
            typeof course.slug === 'string' &&
            typeof course.title === 'string' &&
            !('status' in course) &&
            !('price' in course),
        ),
      JSON.stringify(publicList[0] ?? null).slice(0, 160),
    );
    const seededSlug = publicList[0]?.slug;
    if (seededSlug) {
      const seededDetail = await api(
        'GET',
        `/public/courses/${encodeURIComponent(seededSlug)}`,
      );
      check(
        'public course detail includes related',
        seededDetail.status === 200 &&
          seededDetail.data?.slug === seededSlug &&
          Array.isArray(seededDetail.data?.related),
        `status ${seededDetail.status}`,
      );
    } else {
      console.log('  --  no published course present; skipped detail check');
    }

    const smokeCourseSlug = `smoke-course-${randomBytes(3).toString('hex')}`;
    const smokeCourseBody = {
      slug: smokeCourseSlug,
      title: 'دورة اختبار الدخان',
      shortTitle: 'اختبار',
      courseType: 'HYBRID',
      tagline: 'دورة اختبار مؤقتة تُحذف بعد الفحص',
      summary: 'بيانات اختبار مؤقتة لا تُعرض للعامة.',
      description: ['وصف اختباري مؤقت.'],
      focus: [],
      format: 'حضوري',
      note: 'ملاحظة اختبارية.',
      image: '/images/courses/mechanics.jpg',
      imageAlt: 'صورة اختبارية',
      status: 'DRAFT',
    };
    const agentCourseWrite = await api('POST', '/academy/courses', {
      token: agentToken,
      body: smokeCourseBody,
    });
    check(
      'agent cannot create courses',
      agentCourseWrite.status === 403,
      `status ${agentCourseWrite.status}`,
    );
    const courseCreate = await api('POST', '/academy/courses', {
      token: managerToken,
      body: smokeCourseBody,
    });
    if (courseCreate.status === 201) createdCourseIds.push(courseCreate.data.id);
    check(
      'manager creates draft course',
      courseCreate.status === 201 && courseCreate.data?.status === 'DRAFT',
      `status ${courseCreate.status}`,
    );
    const smokeCourseId = courseCreate.data?.id;
    const publicAfterDraft = await api('GET', '/public/courses');
    check(
      'draft course stays out of public catalog',
      publicAfterDraft.status === 200 &&
        !(publicAfterDraft.data?.items ?? []).some((c) => c.slug === smokeCourseSlug),
      `status ${publicAfterDraft.status}`,
    );
    check(
      'draft course detail is 404',
      (
        await api('GET', `/public/courses/${encodeURIComponent(smokeCourseSlug)}`)
      ).status === 404,
    );

    if (smokeCourseId) {
      const publish = await api('PATCH', `/academy/courses/${smokeCourseId}`, {
        token: managerToken,
        body: { status: 'PUBLISHED' },
      });
      check(
        'manager publishes course',
        publish.status === 200 && publish.data?.status === 'PUBLISHED',
        `status ${publish.status}`,
      );
      const publicAfterPublish = await api(
        'GET',
        `/public/courses/${encodeURIComponent(smokeCourseSlug)}`,
      );
      check(
        'published course becomes public',
        publicAfterPublish.status === 200 &&
          publicAfterPublish.data?.slug === smokeCourseSlug,
        `status ${publicAfterPublish.status}`,
      );

      const agentBatchWrite = await api('POST', '/academy/batches', {
        token: agentToken,
        body: { courseId: smokeCourseId, capacity: 1 },
      });
      check(
        'agent cannot create batches',
        agentBatchWrite.status === 403,
        `status ${agentBatchWrite.status}`,
      );
      const batchCreate = await api('POST', '/academy/batches', {
        token: managerToken,
        body: {
          courseId: smokeCourseId,
          code: `SMK-${randomBytes(3).toString('hex')}`,
          title: 'دفعة اختبار',
          startDate: '2026-11-01',
          endDate: '2026-12-01',
          capacity: 1,
          status: 'OPEN',
        },
      });
      if (batchCreate.status === 201) createdBatchIds.push(batchCreate.data.id);
      check(
        'manager creates open batch',
        batchCreate.status === 201 && batchCreate.data?.status === 'OPEN',
        `status ${batchCreate.status}`,
      );
      const smokeBatchId = batchCreate.data?.id;

      if (smokeBatchId) {
        const firstEnrollment = await api('POST', '/enrollments', {
          token: agentToken,
          body: {
            leadId: agentLead.id,
            courseId: smokeCourseId,
            batchId: smokeBatchId,
            totalFee: 1000,
          },
        });
        check(
          'enrollment binds course and batch',
          firstEnrollment.status === 201 &&
            firstEnrollment.data?.courseId === smokeCourseId &&
            firstEnrollment.data?.batchId === smokeBatchId,
          `status ${firstEnrollment.status} ${JSON.stringify(firstEnrollment.data).slice(0, 160)}`,
        );
        const smokeEnrollmentId = firstEnrollment.data?.id;
        if (smokeEnrollmentId) createdEnrollmentIds.push(smokeEnrollmentId);

        const secondLeadId = massAssign.data?.id;
        if (secondLeadId) {
          const fullBatch = await api('POST', '/enrollments', {
            token: agentToken,
            body: {
              leadId: secondLeadId,
              courseId: smokeCourseId,
              batchId: smokeBatchId,
              totalFee: 1000,
            },
          });
          check(
            'full batch rejects enrollment',
            fullBatch.status === 409 && fullBatch.data?.error === 'BATCH_FULL',
            `status ${fullBatch.status} body ${JSON.stringify(fullBatch.data).slice(0, 120)}`,
          );
        }

        const closedPatch = await api('PATCH', `/academy/batches/${smokeBatchId}`, {
          token: managerToken,
          body: { status: 'COMPLETED' },
        });
        const closedEnrollment = secondLeadId
          ? await api('POST', '/enrollments', {
              token: agentToken,
              body: { leadId: secondLeadId, batchId: smokeBatchId, totalFee: 1000 },
            })
          : { status: 0, data: null };
        check(
          'closed batch rejects enrollment',
          closedPatch.status === 200 &&
            closedEnrollment.status === 409 &&
            closedEnrollment.data?.error === 'BATCH_NOT_OPEN',
          `patch ${closedPatch.status} enroll ${closedEnrollment.status}`,
        );

        if (smokeEnrollmentId) {
          const sessionDate = '2026-10-26';
          const saveAttendance = await api('POST', '/academy/attendance', {
            token: agentToken,
            body: {
              batchId: smokeBatchId,
              sessionDate,
              records: [{ enrollmentId: smokeEnrollmentId, status: 'PRESENT' }],
            },
          });
          check(
            'agent records attendance',
            saveAttendance.status === 200 && saveAttendance.data?.saved === 1,
            `status ${saveAttendance.status}`,
          );
          const sheet = await api(
            'GET',
            `/academy/attendance?batchId=${smokeBatchId}&date=${sessionDate}`,
            { token: agentToken },
          );
          const student = (sheet.data?.students ?? []).find(
            (row) => row.id === smokeEnrollmentId,
          );
          check(
            'attendance sheet reloads saved status',
            sheet.status === 200 && student?.attendance?.status === 'PRESENT',
            `status ${sheet.status} student ${JSON.stringify(student ?? null).slice(0, 160)}`,
          );
          const mismatch = await api('POST', '/academy/attendance', {
            token: agentToken,
            body: {
              batchId: smokeBatchId,
              sessionDate,
              records: [
                {
                  enrollmentId: '00000000-0000-4000-8000-000000000000',
                  status: 'PRESENT',
                },
              ],
            },
          });
          check(
            'attendance rejects foreign enrollment',
            mismatch.status === 400 &&
              mismatch.data?.error === 'ATTENDANCE_ENROLLMENT_MISMATCH',
            `status ${mismatch.status}`,
          );
        }
      }
    }

    console.log('\nUsers administration');
    const created = await api('POST', '/users', {
      token: adminToken,
      body: {
        fullName: 'Smoke Created Agent',
        email: `smoke.created.${randomBytes(4).toString('hex')}@test.local`,
        role: 'AGENT',
        password: PASSWORD,
      },
    });
    if (created.status === 201) createdUserIds.push(created.data.id);
    check('admin creates user 201', created.status === 201, `status ${created.status}`);

    const selfDeactivate = await api('PATCH', `/users/${admin.id}`, {
      token: adminToken,
      body: { isActive: false },
    });
    check('admin cannot deactivate self', selfDeactivate.status === 400, `status ${selfDeactivate.status}`);

    const createdId = created.data?.id;
    if (createdId) {
      const deactivate = await api('PATCH', `/users/${createdId}`, {
        token: adminToken,
        body: { isActive: false },
      });
      check('admin deactivates other user', deactivate.status === 200 && deactivate.data?.isActive === false, `status ${deactivate.status}`);
      const inactiveLogin = await login(created.data.email, PASSWORD);
      check('inactive user cannot log in', inactiveLogin.status === 401, `status ${inactiveLogin.status}`);
      const reset = await api('POST', `/users/${createdId}/password`, {
        token: adminToken,
        body: { password: NEW_PASSWORD },
      });
      check('admin resets password', reset.status === 200 || reset.status === 204, `status ${reset.status}`);
      await api('PATCH', `/users/${createdId}`, { token: adminToken, body: { isActive: true } });
      const newLogin = await login(created.data.email, NEW_PASSWORD);
      check('login works with reset password', newLogin.status === 200, `status ${newLogin.status}`);
    }

    console.log('\nPassword change');
    const wrongCurrent = await api('POST', '/auth/change-password', {
      token: managerToken,
      body: { currentPassword: 'wrong-current-1', newPassword: NEW_PASSWORD },
    });
    check('wrong current password rejected', wrongCurrent.status === 400, `status ${wrongCurrent.status}`);
    const changePw = await api('POST', '/auth/change-password', {
      token: managerToken,
      body: { currentPassword: PASSWORD, newPassword: NEW_PASSWORD },
    });
    check('change password succeeds', changePw.status === 204, `status ${changePw.status}`);
    const managerRelogin = await login(manager.email, NEW_PASSWORD);
    check('login with new password', managerRelogin.status === 200, `status ${managerRelogin.status}`);
    const oldSession = await api('GET', '/auth/me', { token: managerToken });
    check('existing access token survives password change', oldSession.status === 200);

    console.log('\nShared customers and consent');
    const inquiryPhone = `09${String(randomBytes(4).readUInt32BE(0)).slice(0, 8)}`;
    const inquiry = await api('POST', '/public/inquiries', {
      body: {
        fullName: 'Smoke Public Inquiry',
        phone: inquiryPhone,
        contactMethod: 'PHONE',
        consent: true,
      },
    });
    check('public inquiry accepted', inquiry.status === 201 && inquiry.data?.duplicate === false, 'status ' + inquiry.status);
    const duplicateInquiry = await api('POST', '/public/inquiries', { body: { fullName: 'Smoke Public Inquiry', phone: inquiryPhone, contactMethod: 'PHONE', consent: true } });
    check('recent duplicate inquiry is identified', duplicateInquiry.status === 200 && duplicateInquiry.data?.duplicate === true);
    const inquiryLead = await prisma.lead.findFirst({
      where: { phone: inquiryPhone },
      select: { id: true, customerId: true },
    });
    if (inquiryLead) {
      createdLeadIds.push(inquiryLead.id);
      if (inquiryLead.customerId) createdCustomerIds.push(inquiryLead.customerId);
    }
    check(
      'inquiry lead linked to a customer',
      !!inquiryLead?.customerId,
      JSON.stringify(inquiryLead),
    );
    const consent = inquiryLead
      ? await prisma.consentRecord.findFirst({ where: { leadId: inquiryLead.id } })
      : null;
    check(
      'consent recorded with version',
      !!consent && consent.purpose === 'PRIVACY_POLICY_INQUIRY' && !!consent.version,
      JSON.stringify(consent),
    );
    check(
      'API-created leads are linked to customers',
      !!massAssign.data?.customerId,
      JSON.stringify(massAssign.data?.customerId),
    );

    console.log('\nNotifications');
    const assign = await api('PATCH', `/leads/${agentLead.id}/assign`, {
      token: adminToken,
      body: { assignedToId: agent.id },
    });
    check('admin assigns lead', assign.status === 200, `status ${assign.status}`);
    const agentInbox = await api('GET', '/notifications?unread=true', { token: agentToken });
    const assignedNote = (agentInbox.data?.items ?? []).find(
      (item) => item.type === 'LEAD_ASSIGNED' && item.entityId === agentLead.id,
    );
    check(
      'assignee receives unread notification',
      agentInbox.status === 200 && !!assignedNote && agentInbox.data.unreadCount >= 1,
      `status ${agentInbox.status}`,
    );
    if (assignedNote) {
      const read = await api('PATCH', `/notifications/${assignedNote.id}/read`, {
        token: agentToken,
      });
      check('notification marked read', read.status === 204, `status ${read.status}`);
    }
    const markAll = await api('POST', '/notifications/read-all', { token: agentToken });
    check('mark all notifications read', markAll.status === 200, `status ${markAll.status}`);
    const afterRead = await api('GET', '/notifications', { token: agentToken });
    check(
      'unread count is zero after read-all',
      afterRead.status === 200 && afterRead.data?.unreadCount === 0,
      `unread ${afterRead.data?.unreadCount}`,
    );
    const adminInbox = await api('GET', '/notifications', { token: adminToken });
    check(
      'managers receive inquiry notifications',
      adminInbox.status === 200 &&
        adminInbox.data.items.some((item) => item.type === 'LEAD_CREATED'),
      `status ${adminInbox.status}`,
    );

    console.log('\nVehicle brokerage');
    const owner = await prisma.customer.create({data:{fullName:'Smoke vehicle owner',phone:'+1999'+randomBytes(4).toString('hex')},select:{id:true}});
    createdCustomerIds.push(owner.id);
    await prisma.lead.update({where:{id:agentLead.id},data:{customerId:owner.id}});
    const payload={ownerCustomerId:owner.id,make:'Smoke',model:'Testcar',year:2022,city:'Smoke City',askingPrice:10000,currency:'USD',mediaPaths:[],ownerAuthorized:true,ownerAuthorizationMethod:'IN_PERSON',ownerAuthorizationNote:'Smoke owner permission recorded.'};
    const draft=await api('POST','/vehicles',{token:adminToken,body:payload});check('vehicle listing is created as draft',draft.status===201&&draft.data?.status==='DRAFT');
    const id=draft.data?.id;if(id)createdVehicleIds.push(id);
    check('draft is not public',(await api('GET','/public/vehicles/'+id)).status===404);
    check('agent cannot access an unassigned listing',(await api('GET','/vehicles/'+id,{token:agentToken})).status===404);
    const agentDraft=await api('POST','/vehicles',{token:agentToken,body:payload});check('agent listing is assigned to self',agentDraft.status===201&&agentDraft.data?.assignedToId===agent.id);if(agentDraft.data?.id)createdVehicleIds.push(agentDraft.data.id);
    check('agent cannot approve listing',(await api('POST','/vehicles/'+id+'/review',{token:agentToken,body:{status:'APPROVED'}})).status===403);
    const pending=await api('POST','/vehicles/'+id+'/submit',{token:adminToken});check('listing awaits moderation',pending.status===200&&pending.data?.status==='PENDING');
    check('pending listing stays private',(await api('GET','/public/vehicles/'+id)).status===404);
    const approved=await api('POST','/vehicles/'+id+'/review',{token:managerToken,body:{status:'APPROVED'}});
    check('manager approves listing',approved.status===200&&approved.data?.status==='APPROVED');
    const publicVehicle=(await api('GET','/public/vehicles')).data?.items?.find(v=>v.id===id);
    check('public listing has no owner fields',!!publicVehicle&&!('owner' in publicVehicle)&&!('ownerCustomerId' in publicVehicle));
    check('public listing makes no unsupported inspection claim',!!publicVehicle&&!('conditionVerifiedAt' in publicVehicle)&&!('inspectionReference' in publicVehicle));
    const buyer=await prisma.customer.create({data:{fullName:'Smoke vehicle buyer',phone:'+1777'+randomBytes(4).toString('hex')},select:{id:true}});createdCustomerIds.push(buyer.id);
    const createdDeal=await api('POST','/brokerage/deals',{token:adminToken,body:{listingId:id,buyerCustomerId:buyer.id,expectedAmount:9500,currency:'USD'}});
    check('brokerage deal created against approved listing',createdDeal.status===201&&createdDeal.data?.status==='NEW_INQUIRY','status '+createdDeal.status+' error '+createdDeal.data?.error);
    const dealId=createdDeal.data?.id;if(dealId)createdDealIds.push(dealId);
    check('agent cannot see unassigned deal',(await api('GET','/brokerage/deals/'+dealId,{token:agentToken})).status===404);
    check('agent cannot read brokerage financial permissions',(await api('POST','/brokerage/deals/'+dealId+'/commissions',{token:agentToken,body:{}})).status===403);
    const contactStage=await api('PATCH','/brokerage/deals/'+dealId+'/status',{token:adminToken,body:{status:'CONTACTED'}});
    check('deal transition recorded',contactStage.status===200&&contactStage.data?.history?.some(x=>x.to==='CONTACTED'));
    await api('PATCH','/brokerage/deals/'+dealId+'/status',{token:adminToken,body:{status:'NEGOTIATION'}});
    await api('PATCH','/brokerage/deals/'+dealId+'/status',{token:adminToken,body:{status:'AGREEMENT_PENDING'}});
    const agreement=await api('POST','/brokerage/deals/'+dealId+'/commissions',{token:managerToken,body:{payer:'SELLER',calculationType:'PERCENTAGE',calculationBasis:'Final agreed vehicle transaction amount',basisAmount:10000,rateOrAmount:2,currency:'USD',agreementReference:'Smoke written agreement'}});
    check('commission agreement uses explicit terms',agreement.status===201&&Number(agreement.data?.amountDue)===200,'status '+agreement.status+' due '+agreement.data?.amountDue);
    if(agreement.data?.id){const paymentFirst=await api('POST','/brokerage/commissions/'+agreement.data.id+'/payments',{token:managerToken,body:{amount:100,reference:'smoke-partial'}});const paymentOver=await api('POST','/brokerage/commissions/'+agreement.data.id+'/payments',{token:managerToken,body:{amount:101,reference:'smoke-over'}});const paymentRest=await api('POST','/brokerage/commissions/'+agreement.data.id+'/payments',{token:managerToken,body:{amount:100,reference:'smoke-final'}});check('commission payment history and balance enforced',paymentFirst.status===201&&paymentOver.status===400&&paymentRest.status===201&&paymentRest.data?.balance===0);}
    const completedDeal=await api('PATCH','/brokerage/deals/'+dealId+'/status',{token:adminToken,body:{status:'COMPLETED',finalAmount:10000}});
    check('deal completion requires and stores final amount',completedDeal.status===200&&Number(completedDeal.data?.finalAmount)===10000);

    console.log('\nWorkshop and parts request persistence');
    const workshopRequest=await api('POST','/public/workshop-requests',{body:{fullName:'Smoke workshop customer',phone:'+1666'+String(randomBytes(4).readUInt32BE(0)).slice(0,8),vehicleMake:'Smoke',vehicleModel:'Testcar',vehicleYear:2021,requestedService:'Scheduled maintenance',reportedSymptoms:'Customer reports a noise to be checked',consent:true}});
    const workshopId=workshopRequest.data?.requestId;if(workshopId)createdWorkshopRequestIds.push(workshopId);
    check('public workshop request is stored pending confirmation',workshopRequest.status===201&&workshopRequest.data?.status==='NEW',JSON.stringify(workshopRequest));
    check('agents cannot access workshop administration',(await api('GET','/workshop/requests',{token:agentToken})).status===403);
    const workshopList=await api('GET','/workshop/requests',{token:managerToken});
    check('managers can review workshop requests',workshopList.status===200&&workshopList.data.items.some(x=>x.id===workshopId),JSON.stringify(workshopList.data));
    await api('PATCH','/workshop/requests/'+workshopId+'/status',{token:managerToken,body:{status:'REVIEWING'}});
    const workshopConfirmed=await api('PATCH','/workshop/requests/'+workshopId+'/status',{token:managerToken,body:{status:'CONFIRMED'}});
    const workOrder=await api('POST','/workshop/requests/'+workshopId+'/work-order',{token:managerToken,body:{currency:'SYP'}});
    const workOrderId=workOrder.data?.id;
    check('confirmed workshop request becomes work order',workshopConfirmed.status===200&&workOrder.status===201);
    const unapprovedProgress=await api('PATCH','/workshop/work-orders/'+workOrderId,{token:managerToken,body:{status:'DIAGNOSING',confirmedDiagnosis:'Technician recorded a test finding.'}});
    await api('PATCH','/workshop/work-orders/'+workOrderId,{token:managerToken,body:{status:'ESTIMATE_PENDING'}});
    await api('PATCH','/workshop/work-orders/'+workOrderId,{token:managerToken,body:{status:'AWAITING_CUSTOMER_APPROVAL',estimateAmount:500}});
    const blockedProgress=await api('PATCH','/workshop/work-orders/'+workOrderId,{token:managerToken,body:{status:'IN_PROGRESS'}});
    await api('PATCH','/workshop/work-orders/'+workOrderId,{token:managerToken,body:{status:'IN_PROGRESS',customerApprovalReference:'Smoke customer approval recorded'}});
    const inspection=await api('POST','/workshop/work-orders/'+workOrderId+'/inspections',{token:managerToken,body:{checklist:{brakes:'OK',lights:'NOT_CHECKED'},confirmedFindings:'Recorded a smoke-test finding only.',recommendations:'Recheck at the next service.'}});
    const quality=await api('PATCH','/workshop/work-orders/'+workOrderId,{token:managerToken,body:{status:'QUALITY_CHECK'}});
    const delivery=await api('PATCH','/workshop/work-orders/'+workOrderId,{token:managerToken,body:{status:'DELIVERED',finalAmount:500}});
    const workshopPayment=await api('POST','/workshop/work-orders/'+workOrderId+'/payments',{token:managerToken,body:{amount:500,reference:'smoke-workshop-payment'}});
    check('work order requires customer approval and recorded inspection',unapprovedProgress.status===200&&blockedProgress.status===400&&inspection.status===201&&quality.status===200);
    check('workshop final invoice and payment are independent records',delivery.status===200&&workshopPayment.status===201&&workshopPayment.data?.balance===0);

    const partsRequest=await api('POST','/public/parts-requests',{body:{fullName:'Smoke parts customer',phone:'+1555'+String(randomBytes(4).readUInt32BE(0)).slice(0,8),vehicleMake:'Smoke',vehicleModel:'Testcar',partName:'Brake pad set',partNumber:'SMOKE-001',quantity:2,consent:true}});
    const partsId=partsRequest.data?.requestId;if(partsId)createdPartsRequestIds.push(partsId);
    check('public parts request is persisted without stock claims',partsRequest.status===201&&partsRequest.data?.status==='NEW',JSON.stringify(partsRequest));
    check('agents cannot access parts sourcing',(await api('GET','/parts/requests',{token:agentToken})).status===403);
    await api('PATCH','/parts/requests/'+partsId+'/status',{token:managerToken,body:{status:'REVIEWING'}});
    await api('PATCH','/parts/requests/'+partsId+'/status',{token:managerToken,body:{status:'SOURCING'}});
    const quoteOne=await api('POST','/parts/requests/'+partsId+'/quotations',{token:managerToken,body:{supplierName:'Smoke test supplier A',quotedPrice:120,currency:'SYP',availability:'AVAILABLE'}});
    const quoteTwo=await api('POST','/parts/requests/'+partsId+'/quotations',{token:managerToken,body:{supplierName:'Smoke test supplier B',quotedPrice:125,currency:'SYP',availability:'UNCONFIRMED'}});
    await api('PATCH','/parts/requests/'+partsId+'/status',{token:managerToken,body:{status:'AWAITING_CUSTOMER'}});
    const blockedQuote=await api('PATCH','/parts/quotations/'+quoteTwo.data?.id+'/decision',{token:managerToken,body:{decision:'APPROVED',customerDecisionReference:'Customer reviewed'}});
    const acceptedQuote=await api('PATCH','/parts/quotations/'+quoteOne.data?.id+'/decision',{token:managerToken,body:{decision:'APPROVED',customerDecisionReference:'Customer selected quote A'}});
    const partsApproved=await api('PATCH','/parts/requests/'+partsId+'/status',{token:managerToken,body:{status:'APPROVED'}});
    const partsOrdered=await api('PATCH','/parts/requests/'+partsId+'/status',{token:managerToken,body:{status:'ORDERED'}});
    const partsFulfilled=await api('PATCH','/parts/requests/'+partsId+'/status',{token:managerToken,body:{status:'FULFILLED'}});
    check('parts request supports multiple quotations and rejects unconfirmed availability',quoteOne.status===201&&quoteTwo.status===201&&blockedQuote.status===409&&acceptedQuote.status===200);
    check('parts fulfillment follows customer-approved quote',partsApproved.status===200&&partsOrdered.status===200&&partsFulfilled.status===200);
    const lineReport=await api('GET','/reports/business-lines?from=2026-01-01T00:00:00.000Z&to=2026-12-31T23:59:59.999Z',{token:managerToken});
    const agentLineReport=await api('GET','/reports/business-lines',{token:agentToken});
    check('business-line reporting keeps brokerage/workshop/parts financials separate',lineReport.status===200&&Array.isArray(lineReport.data?.brokerage?.collected)&&Array.isArray(lineReport.data?.workshop?.invoices)&&typeof lineReport.data?.parts?.requests==='number');
    check('agents cannot access consolidated business reports',agentLineReport.status===403);
    const phone='+1888'+String(randomBytes(4).readUInt32BE(0)).slice(0,8);
    const vehiclePublicInquiry=await api('POST','/public/vehicles/'+id+'/inquiries',{body:{fullName:'Smoke vehicle inquiry',phone,consent:true}});
    check('vehicle inquiry is accepted',vehiclePublicInquiry.status===201,'status '+vehiclePublicInquiry.status+' error '+vehiclePublicInquiry.data?.error);
    const vehicleLeadFixture=await prisma.lead.findFirst({where:{phone},select:{id:true}});if(vehicleLeadFixture)createdLeadIds.push(vehicleLeadFixture.id);
    const vehicleInquiryActivity=vehicleLeadFixture?await prisma.activity.findFirst({where:{leadId:vehicleLeadFixture.id,type:'VEHICLE_INQUIRY'}}):null;
    check('vehicle inquiry creates lead and activity',!!vehicleLeadFixture&&!!vehicleInquiryActivity);
    const notifications=await api('GET','/notifications?unreadOnly=true',{token:adminToken});
    check('vehicle inquiry notifies administration',notifications.status===200&&notifications.data.items.some(x=>x.type==='VEHICLE_INQUIRY'&&x.entityId===vehicleLeadFixture?.id));


    console.log('\nAudit log');
    const agentAudit = await api('GET', '/audit-logs', { token: agentToken });
    check('agent cannot read audit log', agentAudit.status === 403, `status ${agentAudit.status}`);
    const adminAudit = await api('GET', '/audit-logs?entityType=Lead&pageSize=100', {
      token: adminToken,
    });
    check(
      'audit log recorded lead actions',
      adminAudit.status === 200 &&
        adminAudit.data.items.some(
          (entry) => entry.action === 'lead.assign' && entry.entityId === agentLead.id,
        ),
      `status ${adminAudit.status}`,
    );
    const maskedEmail = `${admin.email.slice(0, 1)}***@${admin.email.split('@')[1]}`;
    const failedAudit = await api(
      'GET',
      `/audit-logs?action=login_failed&pageSize=100`,
      { token: adminToken },
    );
    check(
      'failed login audited without full email',
      failedAudit.status === 200 &&
        failedAudit.data.items.some(
          (entry) =>
            entry.metadata?.email === maskedEmail &&
            !JSON.stringify(entry.metadata).includes(admin.email),
        ),
      `status ${failedAudit.status}`,
    );

    console.log('\nError handling');
    const missing = await api('GET', '/does-not-exist');
    check('unknown api route returns 404', missing.status === 404, `status ${missing.status}`);
    const badJson = await api('POST', '/auth/login', { rawBody: '{bad json' });
    check('invalid JSON returns 400', badJson.status === 400, `status ${badJson.status}`);
  } finally {
    console.log('\nCleanup');
    try {
      if (createdLeadIds.length) { const linkedCustomers = await prisma.lead.findMany({ where: { id: { in: createdLeadIds } }, select: { customerId: true } }); for (const row of linkedCustomers) if (row.customerId && !createdCustomerIds.includes(row.customerId)) createdCustomerIds.push(row.customerId); }
      if (createdLeadIds.length) {
        await prisma.attendance.deleteMany({
          where: { enrollment: { leadId: { in: createdLeadIds } } },
        });
        await prisma.payment.deleteMany({
          where: { enrollment: { leadId: { in: createdLeadIds } } },
        });
        await prisma.enrollment.deleteMany({ where: { leadId: { in: createdLeadIds } } });
        await prisma.consentRecord.deleteMany({ where: { leadId: { in: createdLeadIds } } });
        await prisma.notification.deleteMany({
          where: {
            OR: [
              { entityId: { in: createdLeadIds } },
              { entityId: { in: createdEnrollmentIds } },
            ],
          },
        });
        await prisma.auditLog.deleteMany({ where: { entityId: { in: createdLeadIds } } });
        await prisma.activity.deleteMany({ where: { leadId: { in: createdLeadIds } } });
        await prisma.lead.deleteMany({ where: { id: { in: createdLeadIds } } });
      }
      if (createdBatchIds.length) {
        await prisma.courseBatch.deleteMany({ where: { id: { in: createdBatchIds } } });
      }
      if (createdCourseIds.length) {
        await prisma.course.deleteMany({ where: { id: { in: createdCourseIds } } });
      }
      if (createdVehicleIds.length) {
        const deals = await prisma.brokerageDeal.findMany({ where: { id: { in: createdDealIds } }, select: { id: true } });
        if (deals.length) {
          const agreementIds=(await prisma.commissionAgreement.findMany({where:{dealId:{in:createdDealIds}},select:{id:true}})).map(x=>x.id);
          await prisma.commissionPayment.deleteMany({where:{agreementId:{in:agreementIds}}});
          await prisma.commissionAgreement.deleteMany({where:{id:{in:agreementIds}}});
          await prisma.vehicleViewing.deleteMany({where:{dealId:{in:createdDealIds}}});
          await prisma.brokerageDealStageHistory.deleteMany({where:{dealId:{in:createdDealIds}}});
          await prisma.brokerageDeal.deleteMany({where:{id:{in:createdDealIds}}});
        }
        await prisma.notification.deleteMany({ where: { entityId: { in: createdVehicleIds } } });
        await prisma.auditLog.deleteMany({ where: { entityId: { in: createdVehicleIds } } });
        await prisma.vehicleInquiry.deleteMany({ where: { listingId: { in: createdVehicleIds } } });
        await prisma.vehicleListing.deleteMany({ where: { id: { in: createdVehicleIds } } });
      }
      const requestCustomers=await prisma.customer.findMany({where:{OR:[{workshopRequests:{some:{id:{in:createdWorkshopRequestIds}}}},{partsRequests:{some:{id:{in:createdPartsRequestIds}}}}]},select:{id:true}});
      const requestCustomerIds=requestCustomers.map(x=>x.id);for(const id of requestCustomerIds)if(!createdCustomerIds.includes(id))createdCustomerIds.push(id);
      if(createdWorkshopRequestIds.length){const ids=(await prisma.workshopWorkOrder.findMany({where:{requestId:{in:createdWorkshopRequestIds}},select:{id:true}})).map(x=>x.id);await prisma.workshopPayment.deleteMany({where:{workOrderId:{in:ids}}});await prisma.workshopInspectionRecord.deleteMany({where:{workOrderId:{in:ids}}});await prisma.workshopWorkOrder.deleteMany({where:{id:{in:ids}}});await prisma.workshopRequest.deleteMany({where:{id:{in:createdWorkshopRequestIds}}});}
      if(createdPartsRequestIds.length){await prisma.partsQuotation.deleteMany({where:{requestId:{in:createdPartsRequestIds}}});await prisma.partsRequest.deleteMany({where:{id:{in:createdPartsRequestIds}}});}
      if(requestCustomerIds.length)await prisma.consentRecord.deleteMany({where:{customerId:{in:requestCustomerIds}}});
      const operationEntityIds=[...createdWorkshopRequestIds,...createdPartsRequestIds];if(operationEntityIds.length){await prisma.notification.deleteMany({where:{entityId:{in:operationEntityIds}}});await prisma.auditLog.deleteMany({where:{entityId:{in:operationEntityIds}}});}
      const publicSources = await prisma.campaignSource.findMany({ where: { name: { in: ['الموقع الإلكتروني', 'استفسار سوق المركبات'] }, leads: { none: {} } }, select: { id: true } });
      const newSourceIds = publicSources.filter((source) => !preservedSmokeSourceIds.has(source.id)).map((source) => source.id);
      if (newSourceIds.length) await prisma.campaignSource.deleteMany({ where: { id: { in: newSourceIds } } });
      if (createdCustomerIds.length) {
        await prisma.customer.deleteMany({ where: { id: { in: createdCustomerIds } } });
      }
      if (createdUserIds.length) {
        await prisma.auditLog.deleteMany({ where: { actorId: { in: createdUserIds } } });
        await prisma.activity.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
      if (smokeMaskedEmail) {
        await prisma.auditLog.deleteMany({
          where: { action: 'auth.login_failed', metadata: { path: ['email'], equals: smokeMaskedEmail } },
        });
      }
      console.log(
        `  removed ${createdLeadIds.length} leads, ${createdCustomerIds.length} customers, ` +
          `${createdUserIds.length} users, ${createdCourseIds.length} courses, ` +
          `${createdBatchIds.length} batches, ${createdEnrollmentIds.length} enrollments`,
      );
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
    child.kill();
    await prisma.$disconnect();
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log(`Failures:\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
