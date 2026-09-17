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
    console.log('--- STARTING CATEGORY API TESTS ---');
    
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
    
    // TEST: Create Category (User 1)
    console.log('\\n[TEST] POST /api/categories (User 1)');
    const createRes = await request('/categories', 'POST', { name: 'Work', color: '#ff0000' }, token1);
    console.log(createRes);
    const categoryId = createRes.data.id;

    // TEST: Get Categories (User 1)
    console.log('\\n[TEST] GET /api/categories (User 1)');
    const getRes1 = await request('/categories', 'GET', null, token1);
    console.log(getRes1);
    
    // TEST: Get Categories (User 2) - Should not see User 1's category
    console.log('\\n[TEST] GET /api/categories (User 2)');
    const getRes2 = await request('/categories', 'GET', null, token2);
    console.log(getRes2);
    
    // TEST: Update Category (User 2 trying to update User 1's category)
    console.log('\\n[TEST] PUT /api/categories/:id (User 2 attempts to update User 1 category)');
    try {
      await request(`/categories/${categoryId}`, 'PUT', { name: 'Hacked' }, token2);
      console.log('FAILED: User 2 was able to update User 1 category');
    } catch (err) {
      console.log(`SUCCESS: Blocked cross-user update. Status: ${err.status}`);
    }

    // TEST: Update Category (User 1)
    console.log('\\n[TEST] PUT /api/categories/:id (User 1)');
    const updateRes = await request(`/categories/${categoryId}`, 'PUT', { name: 'Work Updated', color: '#00ff00' }, token1);
    console.log(updateRes);

    // TEST: Delete Category (User 1)
    console.log('\\n[TEST] DELETE /api/categories/:id (User 1)');
    const deleteRes = await request(`/categories/${categoryId}`, 'DELETE', null, token1);
    console.log(deleteRes);

    console.log('\\n--- TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('TEST FAILED:', error);
  }
}

runTests();
