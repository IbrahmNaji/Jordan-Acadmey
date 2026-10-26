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
    check('public inquiry accepted', inquiry.status === 201, `status ${inquiry.status}`);
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
