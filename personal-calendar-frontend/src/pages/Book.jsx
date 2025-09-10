import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import '../styles/Book.css'

export default function Book() {
  const { userId } = useParams()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [bookingInProgress, setBookingInProgress] = useState(false)

  const fetchSlots = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:5000/api/availability/${userId}`)
      
      const sortedSlots = response.data.sort((a, b) => {
        return new Date(a.start) - new Date(b.start)
      })
      
      setSlots(sortedSlots)
    } catch (error) {
      console.error('Error fetching slots:', error)
      alert('שגיאה בטעינת הזמינות')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [userId])

  const bookSlot = async (slot) => {
    try {
      const checkResponse = await axios.get(`http://localhost:5000/api/availability/${userId}`)
      const isSlotAvailable = checkResponse.data.some(availableSlot => {
        const availableTime = new Date(availableSlot.start).getTime()
        const slotTime = new Date(slot.start).getTime()
        return Math.abs(availableTime - slotTime) < 1000
      })
      
      if (!isSlotAvailable) {
        alert('מצטערים, הזמן הזה כבר הוזמן. אנא בחר זמן אחר.')
        await fetchSlots()
        return
      }
    } catch (error) {
      console.error('Error checking slot availability:', error)
      alert('שגיאה בבדיקת זמינות. אנא נסה שוב.')
      return
    }
    
    const visitorName = prompt('השם שלך:')
    if (!visitorName || visitorName.trim() === '') return
    
    const visitorEmail = prompt('האימייל שלך:')
    if (!visitorEmail || visitorEmail.trim() === '') return
    
    setBookingInProgress(true)
    try {
      await axios.post('http://localhost:5000/api/book', {
        userId,
        start: slot.start,
        end: slot.end,
        visitorName: visitorName.trim(),
        visitorEmail: visitorEmail.trim()
      })
      
      alert('הזמנתך נקלטה בהצלחה!')
      fetchSlots()
    } catch (error) {
      console.error('Error booking slot:', error)
      if (error.response && error.response.status === 400) {
        alert('מצטערים, הזמן הזה כבר הוזמן על ידי מישהו אחר. אנא בחר זמן אחר.')
        await fetchSlots()
      } else {
        alert('שגיאה בביצוע ההזמנה. אנא נסה שוב מאוחר יותר.')
      }
    } finally {
      setBookingInProgress(false)
    }
  }

  const getDayName = (dateString) => {
    const days = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת']
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date for day name:', dateString)
      return 'תאריך לא תקין'
    }
    
    return days[date.getDay()]
  }
  
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date for time formatting:', dateString)
      return 'זמן לא תקין'
    }
    
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Jerusalem',
      hour12: false
    })
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date for date formatting:', dateString)
      return 'תאריך לא תקין'
    }
    
    return date.toLocaleDateString('he-IL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      timeZone: 'Asia/Jerusalem'
    })
  }
  
  const groupSlotsByDate = () => {
    const groups = {}
    
    slots.forEach(slot => {
      const date = new Date(slot.start)
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date in slot:', slot)
        return
      }
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      
      groups[dateKey].push(slot)
    })
    
    return groups
  }
  
  const slotsByDate = groupSlotsByDate()
  
  const getDateLabel = (dateKey) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
    
    if (dateKey === todayKey) {
      return 'היום'
    } else if (dateKey === tomorrowKey) {
      return 'מחר'
    }
    return null
  }
  
  return (
    <div className="book-container">
      <h1>הזמנת פגישה</h1>
      
      {loading ? (
        <div className="loading">טוען זמינות...</div>
      ) : Object.keys(slotsByDate).length > 0 ? (
        <div className="calendar-view">
          <h2>זמנים פנויים:</h2>
          
          <div className="days-columns">
            {Object.keys(slotsByDate).sort().map(dateKey => {
              const dateLabel = getDateLabel(dateKey)
              
              return (
                <div key={dateKey} className="day-column">
                  <h3 className="date-header">
                    {getDayName(dateKey)}
                    {dateLabel && <span className="date-label"> ({dateLabel})</span>}
                    <span className="date-number">{formatDate(dateKey)}</span>
                  </h3>
                  <ul className="time-slots">
                    {slotsByDate[dateKey]
                      .sort((a, b) => new Date(a.start) - new Date(b.start)) // מיון נוסף לוודא שהשעות מסודרות
                      .map(slot => (
                        <li key={`${slot.id}-${slot.start}`} className="slot-item">
                          <div className="slot-time">
                            {formatTime(slot.start)} - {formatTime(slot.end)}
                          </div>
                          <button 
                            onClick={() => bookSlot(slot)} 
                            disabled={bookingInProgress}
                            className="book-button"
                          >
                            {bookingInProgress ? 'מבצע הזמנה...' : 'הזמן'}
                          </button>
                        </li>
                      ))
                    }
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="no-slots">
          <p>אין זמנים פנויים כרגע. אנא בדוק שוב מאוחר יותר.</p>
        </div>
      )}
    </div>
  )
}