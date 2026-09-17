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
    console.log('--- STARTING TASK API TESTS ---');
    
    // Create 2 test users
    const user1 = `user1_${Date.now()}`;
    const user2 = `user2_${Date.now()}`;
    
    console.log('Registering Test Users...');
    await request('/auth/register', 'POST', { username: user1, email: `${user1}@test.com`, password: 'password123' });
    await request('/auth/register', 'POST', { username: user2, email: `${user2}@test.com`, password: 'password123' });
    
    const login1 = await request('/auth/login', 'POST', { email: `${user1}@test.com`, password: 'password123' });
    const login2 = await request('/auth/login', 'POST', { email: `${user2}@test.com`, password: 'password123' });
    
    const token1 = login1.accessToken;
    const token2 = login2.accessToken;
    
    // Create Categories
    const catRes1 = await request('/categories', 'POST', { name: 'Work User 1' }, token1);
    const cat1Id = catRes1.data.id;

    const catRes2 = await request('/categories', 'POST', { name: 'Work User 2' }, token2);
    const cat2Id = catRes2.data.id;

    // TEST: Create Task (User 1)
    console.log('\\n[TEST] POST /api/tasks (User 1)');
    const createRes = await request('/tasks', 'POST', { 
      title: 'Finish API', 
      description: 'Implement Task API',
      categoryId: cat1Id,
      dueDate: new Date().toISOString() // today
    }, token1);
    console.log(createRes.message);
    const taskId = createRes.data.id;

    // TEST: Create Task with Invalid Status
    console.log('\\n[TEST] POST /api/tasks (Invalid Status)');
    try {
      await request('/tasks', 'POST', { title: 'Test', status: 'INVALID' }, token1);
      console.log('FAILED: Should reject invalid status');
    } catch (err) {
      console.log(`SUCCESS: Rejected invalid status (${err.status})`);
    }

    // TEST: Create Task with another user's Category
    console.log('\\n[TEST] POST /api/tasks (Cross-user Category)');
    try {
      await request('/tasks', 'POST', { title: 'Steal Category', categoryId: cat2Id }, token1);
      console.log('FAILED: Should reject cross-user category assignment');
    } catch (err) {
      console.log(`SUCCESS: Rejected cross-user category assignment (${err.status})`);
    }

    // TEST: Get Tasks (User 1)
    console.log('\\n[TEST] GET /api/tasks (User 1)');
    const getRes1 = await request('/tasks', 'GET', null, token1);
    console.log(`Tasks count: ${getRes1.data.length}`);
    
    // TEST: Get Stats (User 1)
    console.log('\\n[TEST] GET /api/tasks/stats (User 1)');
    const statsRes1 = await request('/tasks/stats', 'GET', null, token1);
    console.log(statsRes1.data);
    
    // TEST: Get Tasks (User 2) - Ownership isolation
    console.log('\\n[TEST] GET /api/tasks (User 2)');
    const getRes2 = await request('/tasks', 'GET', null, token2);
    console.log(`Tasks count: ${getRes2.data.length}`);
    
    // TEST: Update Task (User 2 trying to update User 1's task)
    console.log('\\n[TEST] PUT /api/tasks/:id (User 2 attempts to update User 1 task)');
    try {
      await request(`/tasks/${taskId}`, 'PUT', { title: 'Hacked Task' }, token2);
      console.log('FAILED: User 2 was able to update User 1 task');
    } catch (err) {
      console.log(`SUCCESS: Blocked cross-user update. Status: ${err.status}`);
    }

    // TEST: Update Task (User 1)
    console.log('\\n[TEST] PUT /api/tasks/:id (User 1)');
    const updateRes = await request(`/tasks/${taskId}`, 'PUT', { status: 'COMPLETED' }, token1);
    console.log(`Update status: ${updateRes.data.status}`);

    // TEST: Delete Task (User 1)
    console.log('\\n[TEST] DELETE /api/tasks/:id (User 1)');
    const deleteRes = await request(`/tasks/${taskId}`, 'DELETE', null, token1);
    console.log(deleteRes.message);

    console.log('\\n--- TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('TEST FAILED:', error.data || error);
  }
}

runTests();
