import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const userId = location.state?.userId
  const [availability, setAvailability] = useState([])
  const [appointments, setAppointments] = useState([])
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)

  const fetchAvailability = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:5000/api/availability/${userId}`)
      const slots = response.data.map(slot => ({
        id: slot.id,
        start: slot.start,
        end: slot.end
      }))
      setAvailability(slots)
    } catch (error) {
      console.error('Error fetching availability:', error)
      alert('שגיאה בטעינת הזמינות')
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async () => {
    if (!userId) return
    setAppointmentsLoading(true)
    try {
      const response = await axios.get(`http://localhost:5000/api/bookings/${userId}`)
      setAppointments(response.data)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      alert('שגיאה בטעינת הפגישות')
    } finally {
      setAppointmentsLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailability()
    fetchAppointments()
  }, [userId])

  const addAvailability = async () => {
    if (!start || !end) return alert('נא להזין זמן התחלה וסיום')
    if (new Date(start) >= new Date(end)) return alert('זמן התחלה חייב להיות לפני זמן סיום')
    
    setLoading(true)
    try {
      await axios.post('http://localhost:5000/api/availability', {
        userId,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString()
      })
      setStart('')
      setEnd('')
      fetchAvailability()
    } catch (error) {
      console.error('Error adding availability:', error)
      alert('שגיאה בהוספת זמינות')
    } finally {
      setLoading(false)
    }
  }
  
  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jerusalem'
    });
  }

  const refreshData = () => {
    fetchAvailability();
    fetchAppointments();
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>לוח בקרה</h1>
        <button className="logout-button" onClick={handleLogout}>התנתק</button>
      </div>
      
      <div className="share-link">
        <h3>קישור לשיתוף לוח הזמנים שלך:</h3>
        <div className="link-container">
          <input 
            type="text" 
            readOnly 
            value={`${window.location.origin}/book/${userId}`} 
          />
          <button onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/book/${userId}`)
            alert('הקישור הועתק!')
          }}>העתק</button>
        </div>
      </div>
      
      <div className="availability-form">
        <h2>הוספת זמינות</h2>
        <div className="form-inputs">
          <div className="input-group">
            <label>זמן התחלה:</label>
            <input 
              type="datetime-local" 
              value={start} 
              onChange={e => setStart(e.target.value)} 
            />
          </div>
          <div className="input-group">
            <label>זמן סיום:</label>
            <input 
              type="datetime-local" 
              value={end} 
              onChange={e => setEnd(e.target.value)} 
            />
          </div>
        </div>
        <button 
          onClick={addAvailability} 
          disabled={loading}
        >
          {loading ? 'מוסיף...' : 'הוסף זמינות'}
        </button>
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-column">
          <div className="appointments-section">
            <div className="section-header">
              <h2>פגישות שנקבעו</h2>
              <button 
                className="refresh-button" 
                onClick={refreshData}
                disabled={appointmentsLoading}
              >
                {appointmentsLoading ? 'מרענן...' : 'רענן'}
              </button>
            </div>
            {appointmentsLoading ? (
              <p>טוען פגישות...</p>
            ) : appointments.length > 0 ? (
              <ul className="appointments-list">
                {appointments.map(appointment => (
                  <li key={appointment.id} className="appointment-item">
                    <div className="appointment-details">
                      <div className="appointment-time">
                        <span className="detail-label">זמן:</span> 
                        <span className="detail-value">{formatDateTime(appointment.start)}</span>
                      </div>
                      <div className="appointment-visitor">
                        <span className="detail-label">שם:</span> 
                        <span className="detail-value">{appointment.visitorName}</span>
                      </div>
                      <div className="appointment-email">
                        <span className="detail-label">אימייל:</span> 
                        <span className="detail-value">{appointment.visitorEmail}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-appointments">אין פגישות שנקבעו כרגע.</p>
            )}
          </div>
        </div>
        
        <div className="dashboard-column">
          <div className="availability-list">
            <div className="section-header">
              <h2>הזמינות שלך</h2>
              <button 
                className="refresh-button" 
                onClick={fetchAvailability}
                disabled={loading}
              >
                {loading ? 'מרענן...' : 'רענן'}
              </button>
            </div>
            {loading ? (
              <p>טוען...</p>
            ) : availability.length > 0 ? (
              <ul>
                {availability.map(a => (
                  <li key={a.id}>
                    {new Date(a.start).toLocaleString('he-IL')} - {new Date(a.end).toLocaleString('he-IL')}
                  </li>
                ))}
              </ul>
            ) : (
              <p>אין זמינות. הוסף זמנים זמינים למפגשים.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
