const http = require('http');

const runTests = async () => {
  const randomUser = 'user' + Date.now();
  const registerData = JSON.stringify({ username: randomUser, email: randomUser + '@example.com', password: 'password123' });
  const loginData = JSON.stringify({ email: randomUser + '@example.com', password: 'password123' });

  // 1. Register
  const reqReg = http.request('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(registerData) }
  }, (resReg) => {
    let d = '';
    resReg.on('data', chunk => d+=chunk);
    resReg.on('end', () => {
      console.log('Register:', d);
      
      // 2. Login
      const loginReq = http.request('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
      }, (resLogin) => {
        console.log('\n--- LOGIN TEST ---');
        console.log('Status:', resLogin.statusCode);
        const setCookie = resLogin.headers['set-cookie'];
        console.log('Set-Cookie Header:', setCookie);

        let data = '';
        resLogin.on('data', chunk => data+=chunk);
        resLogin.on('end', () => {
          console.log('Login Response Body:', data);
          if (!setCookie) {
            console.error('No Set-Cookie header found.');
            process.exit(1);
          }
          const rawCookie = setCookie[0].split(';')[0];
          
          // 3. Refresh
          const refreshReq = http.request('http://localhost:5000/api/auth/refresh-token', {
            method: 'POST',
            headers: { 'Cookie': rawCookie, 'Content-Type': 'application/json', 'Content-Length': 0 }
          }, (resRef) => {
            console.log('\n--- REFRESH TEST ---');
            console.log('Status:', resRef.statusCode);
            let rData = '';
            resRef.on('data', chunk => rData+=chunk);
            resRef.on('end', () => {
              console.log('Refresh Response Body:', rData);

              // 4. Logout
              const logoutReq = http.request('http://localhost:5000/api/auth/logout', {
                method: 'POST',
                headers: { 'Cookie': rawCookie, 'Content-Type': 'application/json', 'Content-Length': 0 }
              }, (resLog) => {
                console.log('\n--- LOGOUT TEST ---');
                console.log('Status:', resLog.statusCode);
                console.log('Set-Cookie Header:', resLog.headers['set-cookie']);
                
                // 5. Refresh after logout
                const refreshFailReq = http.request('http://localhost:5000/api/auth/refresh-token', {
                  method: 'POST',
                  headers: { 'Cookie': rawCookie, 'Content-Type': 'application/json', 'Content-Length': 0 }
                }, (resFail) => {
                   console.log('\n--- REFRESH AFTER LOGOUT TEST ---');
                   console.log('Status:', resFail.statusCode);
                   process.exit(0);
                });
                refreshFailReq.end();
              });
              logoutReq.end();
            });
          });
          refreshReq.end();
        });
      });
      loginReq.write(loginData);
      loginReq.end();
    });
  });
  reqReg.write(registerData);
  reqReg.end();
};

runTests();
