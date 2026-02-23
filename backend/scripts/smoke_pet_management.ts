type AuthResponse = {
  user: {
    id: number | string;
    email: string;
  };
  token: string;
};

type PetManagementResponse = {
  pets?: Array<{ id: string; name: string }>;
  medicineReminders?: Array<{ id: string; petId: string }>;
};

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:5000/api';
const runId = Date.now();
const testEmail = `pet-smoke-${runId}@example.com`;
const testPassword = 'SmokeTest123A';
const testName = `Smoke Tester ${runId}`;

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const request = async <T>(path: string, init: RequestInit, expectedStatus: number): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, init);
  const payloadText = await response.text();
  const payload = payloadText ? JSON.parse(payloadText) : null;

  if (response.status !== expectedStatus) {
    throw new Error(
      `Unexpected status for ${path}: expected ${expectedStatus}, got ${response.status}. Payload: ${payloadText}`
    );
  }

  return payload as T;
};

const run = async (): Promise<void> => {
  console.log(`Running pet-management smoke test against ${baseUrl}`);

  const signup = await request<AuthResponse>(
    '/auth/signup',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    },
    201
  );

  assert(Boolean(signup?.token), 'Signup token missing');
  assert(Boolean(signup?.user?.id), 'Signup user id missing');

  const userId = signup.user.id;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${signup.token}`,
  };

  const initial = await request<PetManagementResponse>(
    `/auth/${encodeURIComponent(String(userId))}/pet-management`,
    {
      method: 'GET',
      headers: authHeaders,
    },
    200
  );

  assert(Array.isArray(initial.pets), 'Initial pets array missing');
  assert(Array.isArray(initial.medicineReminders), 'Initial reminders array missing');

  const createPet = await request<{ pet: { id: string; name: string } }>(
    `/auth/${encodeURIComponent(String(userId))}/pets`,
    {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Nala',
        type: 'cat',
        gender: 'female',
        breed: 'Persian',
        weight: 3.4,
        activityLevel: 'medium',
      }),
    },
    201
  );

  const petId = createPet.pet.id;
  assert(Boolean(petId), 'Created pet id missing');

  await request(
    `/auth/${encodeURIComponent(String(userId))}/pets/${encodeURIComponent(petId)}/weights`,
    {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ weight: 3.6 }),
    },
    201
  );

  const createReminder = await request<{ reminder: { id: string } }>(
    `/auth/${encodeURIComponent(String(userId))}/reminders`,
    {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        petId,
        medicineName: 'Vitamin Syrup',
        dosage: '5ml',
        frequency: 'daily',
        startDate: new Date().toISOString(),
        nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        notes: 'After breakfast',
        isActive: true,
        notificationEnabled: true,
      }),
    },
    201
  );

  const reminderId = createReminder.reminder.id;
  assert(Boolean(reminderId), 'Created reminder id missing');

  await request(
    `/auth/${encodeURIComponent(String(userId))}/reminders/${encodeURIComponent(reminderId)}/mark-given`,
    {
      method: 'POST',
      headers: authHeaders,
    },
    200
  );

  await request(
    `/auth/${encodeURIComponent(String(userId))}/reminders/${encodeURIComponent(reminderId)}`,
    {
      method: 'DELETE',
      headers: authHeaders,
    },
    200
  );

  await request(
    `/auth/${encodeURIComponent(String(userId))}/pets/${encodeURIComponent(petId)}`,
    {
      method: 'DELETE',
      headers: authHeaders,
    },
    200
  );

  const finalState = await request<PetManagementResponse>(
    `/auth/${encodeURIComponent(String(userId))}/pet-management`,
    {
      method: 'GET',
      headers: authHeaders,
    },
    200
  );

  assert((finalState.pets || []).length === 0, 'Final pets list is not empty');
  assert((finalState.medicineReminders || []).length === 0, 'Final reminders list is not empty');

  console.log('✅ Pet-management smoke test passed');
};

run().catch((error) => {
  console.error('❌ Pet-management smoke test failed');
  console.error(error);
  process.exitCode = 1;
});
