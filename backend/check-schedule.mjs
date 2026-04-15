const base = 'http://localhost:3000';

async function req(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, data };
}

async function main() {
  const employerLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'owner@company.com', password: 'password123' },
  });

  const employeeLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'juan.garcia@company.com', password: 'password123' },
  });

  if (employerLogin.status !== 200 || employeeLogin.status !== 200) {
    console.log(JSON.stringify({ error: 'login failed', employerLogin, employeeLogin }, null, 2));
    process.exit(1);
  }

  const employerToken = employerLogin.data.token;
  const employeeToken = employeeLogin.data.token;

  const employeesRes = await req('/employees', { token: employerToken });
  if (employeesRes.status !== 200 || !Array.isArray(employeesRes.data.employees)) {
    console.log(JSON.stringify({ error: 'employees fetch failed', employeesRes }, null, 2));
    process.exit(1);
  }

  const juan = employeesRes.data.employees.find((e) => e.email === 'juan.garcia@company.com');
  const maria = employeesRes.data.employees.find((e) => e.email === 'maria.fernandez@company.com');

  if (!juan || !maria) {
    console.log(JSON.stringify({ error: 'seed employees not found', employees: employeesRes.data.employees }, null, 2));
    process.exit(1);
  }

  const putRes = await req('/schedule', {
    method: 'PUT',
    token: employerToken,
    body: {
      entries: [
        { date: '2026-04-06', shiftType: 'MORNING', employeeId: juan.id },
        { date: '2026-04-06', shiftType: 'AFTERNOON', employeeId: maria.id },
        { date: '2026-04-07', shiftType: 'NIGHT', employeeId: juan.id },
      ],
    },
  });

  const getEmployer = await req('/schedule', { token: employerToken });
  const getEmployee = await req('/schedule', { token: employeeToken });
  const getWeek = await req('/schedule?weekOf=2026-04-06', { token: employerToken });
  const getRange = await req('/schedule?startDate=2026-04-06&endDate=2026-04-12', { token: employerToken });

  const summary = {
    putStatus: putRes.status,
    getEmployerStatus: getEmployer.status,
    getEmployeeStatus: getEmployee.status,
    getWeekStatus: getWeek.status,
    getRangeStatus: getRange.status,
    employerCount: Array.isArray(getEmployer.data?.schedule) ? getEmployer.data.schedule.length : null,
    employeeCount: Array.isArray(getEmployee.data?.schedule) ? getEmployee.data.schedule.length : null,
    weekCount: Array.isArray(getWeek.data?.schedule) ? getWeek.data.schedule.length : null,
    rangeCount: Array.isArray(getRange.data?.schedule) ? getRange.data.schedule.length : null,
    employeeEntriesOwnedByJuan: Array.isArray(getEmployee.data?.schedule)
      ? getEmployee.data.schedule.every((s) => s.employee?.id === juan.id)
      : null,
    sampleEmployeeView: getEmployee.data?.schedule?.[0] ?? null,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
