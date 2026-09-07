import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

// keepalive: true — เมื่อแท็บ/แอปถูกปิดกะทันหัน เบราว์เซอร์ปกติจะยกเลิก
// network request ที่ยังไม่เสร็จทันที ทำให้การ push snapshot ตอน pagehide
// (ดู App.jsx: forceSave) อาจไม่ทันถึงปลายทาง. keepalive บอกเบราว์เซอร์ว่า
// "ขอให้ request นี้ทำต่อจนจบแม้หน้าจะปิดไปแล้ว" (เหมือนที่ sendBeacon ทำ)
// จำกัดแค่ payload เล็ก ๆ (~64KB) ซึ่ง snapshot ของเราเล็กกว่านั้นมาก จึงไม่
// กระทบ request อื่น ๆ ที่ใหญ่กว่า (มีน้อยมากในแอปนี้) ให้ทุก request จากคลาย
// เอนต์นี้ได้ประโยชน์ตัวนี้ไปด้วยเป็นค่าเริ่มต้น
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options = {}) => fetch(url, { ...options, keepalive: true }),
  },
})
