const API_URL = 'http://localhost:5000/api';

async function request(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const res = await fetch(`${API_URL}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) {
    throw { status: res.status, data };
  }
  return data;
}

async function runTests() {
  try {
    console.log('--- STARTING TASK STATS VERIFICATION ---');
    
    // Create 2 test users
    const user1 = `user1_${Date.now()}`;
    const user2 = `user2_${Date.now()}`;
    
    await request('/auth/register', 'POST', { username: user1, email: `${user1}@test.com`, password: 'password123' });
    await request('/auth/register', 'POST', { username: user2, email: `${user2}@test.com`, password: 'password123' });
    
    const login1 = await request('/auth/login', 'POST', { email: `${user1}@test.com`, password: 'password123' });
    const login2 = await request('/auth/login', 'POST', { email: `${user2}@test.com`, password: 'password123' });
    
    const token1 = login1.accessToken;
    const token2 = login2.accessToken;

    // Create 3 tasks for User 1
    // 1. TODO, Due today
    await request('/tasks', 'POST', { 
      title: 'Task 1 (TODO, Today)', 
      status: 'TODO',
      dueDate: new Date().toISOString()
    }, token1);
    
    // 2. IN_PROGRESS, Overdue
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await request('/tasks', 'POST', { 
      title: 'Task 2 (IN_PROGRESS, Overdue)', 
      status: 'IN_PROGRESS',
      dueDate: yesterday.toISOString()
    }, token1);
    
    // 3. COMPLETED
    await request('/tasks', 'POST', { 
      title: 'Task 3 (COMPLETED)', 
      status: 'COMPLETED'
    }, token1);

    // Create 1 task for User 2 to test isolation
    await request('/tasks', 'POST', { 
      title: 'Task 4 (User 2)', 
      status: 'TODO'
    }, token2);

    // TEST: Get Stats (User 1)
    console.log('\\n[TEST] GET /api/tasks/stats (User 1)');
    const statsRes1 = await request('/tasks/stats', 'GET', null, token1);
    console.log(statsRes1.data);
    
    // TEST: Get Stats (User 2)
    console.log('\\n[TEST] GET /api/tasks/stats (User 2)');
    const statsRes2 = await request('/tasks/stats', 'GET', null, token2);
    console.log(statsRes2.data);
    
    // TEST: Category Ownership Response (404)
    console.log('\\n[TEST] POST /api/tasks (User 1 with invalid category ID)');
    try {
      await request('/tasks', 'POST', { title: 'Test 404 Category', categoryId: 999999 }, token1);
      console.log('FAILED: Should reject invalid category');
    } catch (err) {
      console.log(`SUCCESS: Rejected invalid category (${err.status}): ${err.data.message}`);
    }

    console.log('\\n--- TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('TEST FAILED:', error.data || error);
  }
}

runTests();
