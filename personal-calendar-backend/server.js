const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// create
app.post('/api/availability', async (req, res) => {
  const { userId, start, end } = req.body;
  try {
    const docRef = await db.collection('users')
    .doc(userId)
    .collection('availability')
    .add({ start, end });
    res.json({ id: docRef.id, start, end });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const splitToHalfHourSlots = (start, end) => {
  const slots = [];
  const startTime = new Date(start);
  const endTime = new Date(end);
  
  let currentTime = new Date(startTime);
  
  while (currentTime < endTime) {
    const slotStart = new Date(currentTime);
    
    currentTime.setMinutes(currentTime.getMinutes() + 30);
    
    const slotEnd = currentTime > endTime ? new Date(endTime) : new Date(currentTime);
    
    if ((slotEnd - slotStart) < 30 * 60 * 1000) continue;
    
    slots.push({
      start: slotStart.toISOString(),
      end: slotEnd.toISOString()
    });
  }
  
  return slots;
};

app.get('/api/availability/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const availabilitySnapshot = await db.collection('users')
    .doc(userId)
    .collection('availability')
    .get();
    const availabilityRanges = availabilitySnapshot.docs.map(doc => ({
      id: doc.id,
      start: doc.data().start,
      end: doc.data().end
    }));
    
    const bookingsSnapshot = await db.collection('users')
    .doc(userId)
    .collection('bookings')
    .get();
    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      start: doc.data().start
    }));
    
    let allSlots = [];
    
    availabilityRanges.forEach(range => {
      const slots = splitToHalfHourSlots(range.start, range.end);
      slots.forEach(slot => {
        allSlots.push({
          id: `${range.id}_${slot.start}`,
          originalRangeId: range.id,
          start: slot.start,
          end: slot.end
        });
      });
    });
    
    const availableSlots = allSlots.filter(slot => {
      return !bookings.some(booking => 
        new Date(booking.start).getTime() === new Date(slot.start).getTime()
      );
    });
    
    res.json(availableSlots);
  } catch (e) {
    console.error('Error fetching availability:', e);
    res.status(500).json({ error: e.message });
  }
});

//Booking (customer)
app.post('/api/book', async (req, res) => {
  const { userId, start, end, visitorName, visitorEmail } = req.body;
  try {
    const bookingsRef = db.collection('users')
    .doc(userId)
    .collection('bookings');
    const snapshot = await bookingsRef.where('start', '==', start).get();
    if (!snapshot.empty) return res.status(400).json({ error: 'Slot already booked' });

    await bookingsRef.add({ start, end, visitorName, visitorEmail });
    res.json({ message: 'Booked successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get bookings - user
app.get('/api/bookings/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const bookingsSnapshot = await db.collection('users')
      .doc(userId)
      .collection('bookings')
      .orderBy('start', 'asc')
      .get();
    
    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      start: doc.data().start,
      end: doc.data().end,
      visitorName: doc.data().visitorName,
      visitorEmail: doc.data().visitorEmail
    }));
    
    res.json(bookings);
  } catch (e) {
    console.error('Error fetching bookings:', e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
