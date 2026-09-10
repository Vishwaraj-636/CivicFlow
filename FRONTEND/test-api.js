import axios from 'axios';

const api = axios.create({
   baseURL: 'http://localhost:3000/api',
   withCredentials: true,
   headers: {
      'Content-Type': 'application/json'
   }
});

async function testBackend() {
   const users = [
      { email: 'admin1@gmail.com', pass: 'test123' },
      { email: 'citizen1@gmail.com', pass: 'test123' },
      { email: 'vishwaraj.singh1523@gmail.com', pass: 'test123' }
   ];

   console.log('--- BACKEND API TESTS ---');

   for (const u of users) {
      console.log(`\nTesting user: ${u.email}`);
      try {
         // Login
         const loginRes = await api.post('/auth/login', {
            email: u.email,
            password: u.pass
         });
         console.log(`[OK] Login successful. Role: ${loginRes.data.user.role}`);

         const cookie = loginRes.headers['set-cookie'];
         const client = axios.create({
            baseURL: 'http://localhost:3000/api',
            withCredentials: true,
            headers: {
               'Content-Type': 'application/json',
               'Cookie': cookie ? cookie.join('; ') : ''
            }
         });

         // Get Current User Profile
         const profileRes = await client.get('/auth/me');
         console.log(`[OK] Profile fetched. Name: ${profileRes.data.user.name}`);

         // If Citizen, try to fetch their complaints
         if (loginRes.data.user.role === 'citizen') {
            try {
               const complaintRes = await client.get('/complaints/my-complaints');
               console.log(`[OK] Citizen complaints fetched. Count: ${complaintRes.data.complaints.length}`);
            } catch (e) {
               console.error(`[FAIL] Citizen complaints fetch failed: ${e.response?.data?.message || e.message}`);
            }
         }

         // If Staff, try to fetch staff complaints
         if (loginRes.data.user.role === 'dept_staff') {
            try {
               const queueRes = await client.get('/complaints/department-queue');
               console.log(`[OK] Staff queue fetched. Count: ${queueRes.data.complaints.length}`);
            } catch (e) {
               console.error(`[FAIL] Staff queue fetch failed: ${e.response?.data?.message || e.message}`);
            }
         }

         // If Admin, try to fetch staff requests
         if (loginRes.data.user.role === 'admin') {
            try {
               const reqsRes = await client.get('/admin/staff-requests');
               console.log(`[OK] Admin staff requests fetched.`);
            } catch (e) {
               console.error(`[FAIL] Admin staff requests fetch failed: ${e.response?.data?.message || e.message}`);
            }
         }

      } catch (err) {
         console.error(`[FAIL] Test sequence failed for ${u.email}: ${err.response?.data?.message || err.message}`);
      }
   }
}

testBackend();
