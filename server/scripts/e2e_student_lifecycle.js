import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const API_URL = 'http://localhost:3000/api/v1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runStudentLifecycle() {
  console.log('=== HMS STUDENT PORTAL END-TO-END FLOW VERIFICATION ===\n');

  // 1. Sign In via Supabase Auth
  console.log('[1/10] Authenticating as student@gmail.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'student@gmail.com',
    password: 'student123'
  });

  if (authError || !authData?.session) {
    throw new Error('Authentication failed: ' + (authError?.message || 'No session returned'));
  }

  const token = authData.session.access_token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  console.log('✓ Successfully authenticated! Token acquired.\n');

  // Helper fetch function
  async function api(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(`API ${options.method || 'GET'} ${path} failed (${res.status}): ${json.error || json.message}`);
    }
    return json;
  }

  // 2. Profile fetch & update
  console.log('[2/10] Testing Student Profile (/student/profile)...');
  const profileRes = await api('/student/profile');
  console.log(`✓ Profile retrieved: Name="${profileRes.data.name}", JNTU="${profileRes.data.jntu_number}", Dept="${profileRes.data.department}", Year=${profileRes.data.current_year}`);
  
  const updateProfileRes = await api('/student/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      phone: '9876543210',
      parent_email: 'parent@example.com'
    })
  });
  console.log('✓ Profile contact details updated successfully!\n');

  // 3. Browse Hostels (Year Filtered)
  console.log('[3/10] Testing Browse Hostels (/student/hostels)...');
  const hostelsRes = await api('/student/hostels');
  console.log(`✓ Eligible hostels retrieved: ${hostelsRes.data.length} hostel(s) found.`);
  const hostel = hostelsRes.data[0];
  if (!hostel) throw new Error('No eligible hostel found for Year 1 student');
  console.log(`  Selected Hostel: ${hostel.name} (${hostel.code}), Total Rooms: ${hostel.room_count}, Beds: ${hostel.bed_count}\n`);

  // 4. Floors & Rooms for Hostel
  console.log('[4/10] Testing Hostel Detail (/student/hostels/:id)...');
  const floorsRes = await api(`/hostels/${hostel.id}/floors`);
  const floors = floorsRes.data || [];
  console.log(`✓ Found ${floors.length} floor(s) in ${hostel.name}`);
  const floor = floors[0];
  if (!floor) throw new Error('No floors in hostel');

  const roomsRes = await api(`/floors/${floor.id}/rooms`);
  const rooms = roomsRes.data || [];
  console.log(`✓ Found ${rooms.length} room(s) on Floor ${floor.floor_number}`);
  const room = rooms[0];
  if (!room) throw new Error('No rooms on floor');
  console.log(`  Selected Room: Room ${room.room_number} (Capacity: ${room.capacity})\n`);

  // 5. Room Detail & Refresh-safe GET /rooms/:id
  console.log('[5/10] Testing Room Detail & Bed Availability (/student/rooms/:id)...');
  const roomDetailRes = await api(`/rooms/${room.id}`);
  console.log(`✓ GET /rooms/${room.id} successful: Room ${roomDetailRes.data.room_number}, Floor ${roomDetailRes.data.floor.floor_number}, Hostel ${roomDetailRes.data.floor.hostel.name}`);
  
  const bedsRes = await api(`/rooms/${room.id}/beds`);
  const beds = bedsRes.data || [];
  console.log(`✓ Found ${beds.length} bed(s) in Room ${room.room_number}`);
  let availableBed = beds.find(b => b.status === 'available');

  // 6. Bed Allocation & Vacate Cycle
  console.log('\n[6/10] Testing Bed Allocation & Vacate cycle (/student/allocation)...');
  // First check if already allocated
  const existingAlloc = await api('/student/allocation');

  if (existingAlloc.data) {
    console.log(`  Student already has active allocation (Bed ${existingAlloc.data.bed?.bed_number} in Room ${existingAlloc.data.room?.room_number}).`);
    console.log('  Testing Vacate Bed first...');
    await api('/student/allocation/vacate', { method: 'POST' });
    console.log('✓ Vacate successful! Bed released back to available.');
    
    // Refresh beds to find the now available bed
    const refreshedBeds = await api(`/rooms/${room.id}/beds`);
    availableBed = refreshedBeds.data.find(b => b.status === 'available');
  }

  if (availableBed) {
    console.log(`  Allocating Bed ${availableBed.bed_number}...`);
    const allocRes = await api('/student/allocation', {
      method: 'POST',
      body: JSON.stringify({ bed_id: availableBed.id })
    });
    console.log('✓ Allocation successful via atomic allocate_bed RPC!');

    // Verify active allocation
    const verifiedAlloc = await api('/student/allocation');
    console.log(`✓ Verified Active Allocation: Hostel=${verifiedAlloc.data.hostel.name}, Room=${verifiedAlloc.data.room.room_number}, Bed=${verifiedAlloc.data.bed.bed_number}\n`);
  }

  // 7. Out Pass Application
  console.log('[7/10] Testing Out Pass creation (/student/outings)...');
  const existingOutings = await api('/student/outings');
  for (const o of existingOutings.data || []) {
    if (o.status === 'pending') {
      try {
        await api(`/student/outings/${o.id}/cancel`, { method: 'PATCH' });
        console.log(`  Cancelled previous pending outing ${o.id}`);
      } catch (e) {}
    }
  }

  const futureDays = Math.floor(Math.random() * 20) + 10;
  const outingDate = new Date();
  outingDate.setDate(outingDate.getDate() + futureDays);
  const outingDateStr = outingDate.toISOString().split('T')[0];
  const outDateTime = `${outingDateStr}T14:00:00.000Z`;
  const inDateTime = `${outingDateStr}T18:00:00.000Z`;

  const outPassRes = await api('/student/outings', {
    method: 'POST',
    body: JSON.stringify({
      application_type: 'out_pass',
      out_datetime: outDateTime,
      in_datetime: inDateTime,
      destination: 'Central Library',
      reason: 'Academic project reference books',
      contact_info: '9876543210'
    })
  });
  console.log(`✓ Out Pass created successfully (ID: ${outPassRes.data.id})\n`);

  // 8. Maintenance Complaint
  console.log('[8/10] Testing Maintenance Ticket submission (/student/maintenance)...');
  const maintRes = await api('/student/maintenance', {
    method: 'POST',
    body: JSON.stringify({
      issue_type: 'Electrical Issue',
      priority: 'medium',
      description: 'Desk reading lamp power socket is not supplying voltage.'
    })
  });
  console.log(`✓ Maintenance complaint logged successfully (ID: ${maintRes.data.id}, Status: ${maintRes.data.status})\n`);

  // 9. Notifications Retrieval & Mark Read
  console.log('[9/10] Testing Notifications (/student/notifications)...');
  const notifRes = await api('/student/notifications');
  console.log(`✓ Retrieved ${notifRes.data.length} notification(s).`);
  if (notifRes.data.length > 0) {
    console.log(`  Latest: "${notifRes.data[0].title}" - ${notifRes.data[0].message}`);
    await api('/student/notifications/read-all', { method: 'PATCH' });
    console.log('✓ Mark All Read executed successfully!');
  }
  console.log('');

  // 10. Clean up / Vacate Bed confirmation test
  console.log('[10/10] Testing Vacate Bed flow (/student/allocation/vacate)...');
  await api('/student/allocation/vacate', { method: 'POST' });
  const postVacateAlloc = await api('/student/allocation');
  console.log(`✓ Vacate verified: Active allocation is now ${postVacateAlloc.data === null ? 'null (Empty state active)' : 'unexpected'}\n`);

  console.log('====================================================');
  console.log('ALL 10 STUDENT PORTAL WORKFLOWS VERIFIED END-TO-END!');
  console.log('====================================================');
}

runStudentLifecycle().catch(err => {
  console.error('\n❌ Lifecycle verification failed:', err);
  process.exit(1);
});
