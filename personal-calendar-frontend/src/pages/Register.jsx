import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import '../styles/Register.css'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      return setError('הסיסמאות אינן תואמות')
    }
    
    setLoading(true)
    
    try {
      //create new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        name: name,
        createdAt: new Date().toISOString()
      })
      
      console.log('Registration successful', user)
      navigate('/dashboard', { state: { userId: user.uid } })
    } catch (error) {
      console.error('Registration error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <h1>הרשמה</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="שם מלא"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="אימות סיסמה"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'נרשם...' : 'הירשם'}
        </button>
      </form>
      <p className="login-link">
        כבר יש לך חשבון? <Link to="/">התחבר כאן</Link>
      </p>
    </div>
  )
}
