import { bookings, companions, rentProps, reviews, servicePlans } from '@/data/mockData'
import { request } from '@/services/httpClient'

export const ADMIN_DATA_KEY = 'blackdate_admin_data'

const legacyText = {
  'Khach Demo': 'Khách Demo',
  'Linh Ngoc': 'Linh Ngọc',
  'Minh Tuan': 'Minh Tuấn',
  'Hoang Long': 'Hoàng Long',
  'Ca phe': 'Cà phê',
  'Di dao': 'Đi dạo',
  'Am nhac': 'Âm nhạc',
  'Nghe thuat': 'Nghệ thuật',
  'Phim anh': 'Phim ảnh',
  'Du lich': 'Du lịch',
  'Nau an': 'Nấu ăn',
  Sach: 'Sách',
  'The thao': 'Thể thao',
  'Vu dao': 'Vũ đạo',
  'Thoi trang': 'Thời trang',
  'Thu gian': 'Thư giãn',
  'Trang phuc': 'Trang phục',
  'Phu kien': 'Phụ kiện',
  'Hoa tuoi': 'Hoa tươi',
  'Bo trang diem luxury': 'Bộ trang điểm luxury',
  'Vay da hoi couture': 'Váy dạ hội couture',
  'May anh film vintage': 'Máy ảnh film vintage',
  'Bo hoa cao cap': 'Bó hoa cao cấp',
  'Set nen thom candlelight': 'Set nến thơm candlelight',
  'Tui xach designer': 'Túi xách designer',
  'Co Ban': 'Cơ Bản',
  'Lang Man': 'Lãng Mạn',
  '2 gio': '2 giờ',
  '4 gio': '4 giờ',
  'ca ngay': 'cả ngày',
  'Gon nhe cho lan dau trai nghiem': 'Gọn nhẹ cho lần đầu trải nghiệm',
  'Trai nghiem tron ven va duoc uu tien': 'Trải nghiệm trọn vẹn và được ưu tiên',
  'Lich linh hoat voi cham soc rieng': 'Lịch linh hoạt với chăm sóc riêng',
  'Di dao hoac ca phe': 'Đi dạo hoặc cà phê',
  'Chat truoc 30 phut': 'Chat trước 30 phút',
  'Ho tro doi lich': 'Hỗ trợ đổi lịch',
  'Moi hoat dong trong goi': 'Mọi hoạt động trong gói',
  'Chat truoc 1 gio': 'Chat trước 1 giờ',
  'Anh ky niem': 'Ảnh kỷ niệm',
  'Uu tien ho tro': 'Ưu tiên hỗ trợ',
  'Khong gioi han thoi gian': 'Không giới hạn thời gian',
  'Tu van ca nhan': 'Tư vấn cá nhân',
  'Qua tang cao cap': 'Quà tặng cao cấp',
  'Bao mat rieng tu': 'Bảo mật riêng tư',
  'Dao cu cao cap': 'Đạo cụ cao cấp',
  'Bo suu tap': 'Bộ sưu tập',
  'dao cu noi bat': 'đạo cụ nổi bật',
  'Uu dai dac biet hom nay': 'Ưu đãi đặc biệt hôm nay',
  'Hot nhat tuan': 'Hot nhất tuần',
  'Noi bat': 'Nổi bật',
  '/ 4 gio': '/ 4 giờ',
  'Highlands Coffee Le Loi': 'Highlands Coffee Lê Lợi',
  'Nang dong, hai huoc va biet tao khong khi thoai mai cho nhung buoi gap mat nhe nhang.': 'Năng động, hài hước và biết tạo không khí thoải mái cho những buổi gặp mặt nhẹ nhàng.',
  'Gu tham my tot, thich nhung quan cafe yen tinh va cac buoi tro chuyen co chieu sau.': 'Gu thẩm mỹ tốt, thích những quán cafe yên tĩnh và các buổi trò chuyện có chiều sâu.',
  'Diu dang, chu dao va luon mang lai cam giac binh yen trong moi lich hen.': 'Dịu dàng, chu đáo và luôn mang lại cảm giác bình yên trong mỗi lịch hẹn.',
  'Nhieu nang luong, vui tinh va phu hop voi nhung cuoc hen can su tu nhien.': 'Nhiều năng lượng, vui tính và phù hợp với những cuộc hẹn cần sự tự nhiên.',
  'Ca tinh, noi bat va rat hop voi nhung buoi toi can khong khi soi dong.': 'Cá tính, nổi bật và rất hợp với những buổi tối cần không khí sôi động.',
  'Diem tinh, tinh te va phu hop voi cac lich hen can su rieng tu, cham rai.': 'Điềm tĩnh, tinh tế và phù hợp với các lịch hẹn cần sự riêng tư, chậm rãi.',
  'Thue phu kien, trang phuc va bo set chup anh de buoi hen co nhieu diem nho hon.': 'Thuê phụ kiện, trang phục và bộ set chụp ảnh để buổi hẹn có nhiều điểm nhớ hơn.',
  'Giu shift + lan chuot hoac bam mui ten de xem them': 'Giữ Shift + lăn chuột hoặc bấm mũi tên để xem thêm',
}

export function createDefaultAdminData() {
  return {
    users: [
      {
        id: 1,
        avatar: 'BD',
        name: 'Admin BlackDate',
        email: 'admin@blackdate.local',
        phone: '0900000000',
        role: 'admin',
        status: 'active',
      },
      {
        id: 2,
        avatar: 'KD',
        name: 'Khách Demo',
        email: 'demo@blackdate.local',
        phone: '0912345678',
        role: 'customer',
        status: 'active',
      },
    ],
    companions: companions.map((item) => ({
      ...item,
      fullName: item.fullName || item.name,
      birthDate: item.birthDate || '',
      height: item.height || '',
      weight: item.weight || '',
      measurements: item.measurements || '',
      interests: item.interests || item.tags.join(', '),
      status: 'available',
    })),
    plans: servicePlans.map((item) => ({ ...item, status: 'active' })),
    rentProps: rentProps.map((item) => ({ ...item, status: 'active' })),
    rentHero: [
      {
        id: 1,
        image: '/uploads/avatars/companions-2.jpg',
        eyebrow: 'Đạo cụ cao cấp',
        title: 'Rent Props',
        subtitle: 'Bộ sưu tập',
        highlight: 'đạo cụ nổi bật',
        desc: 'Thuê phụ kiện, trang phục và bộ set chụp ảnh để buổi hẹn có nhiều điểm nhớ hơn.',
        dragHint: 'Giữ Shift + lăn chuột hoặc bấm mũi tên để xem thêm',
      },
    ],
    promo: [
      {
        id: 1,
        image: companions[0]?.image || '',
        ribbon: 'Ưu đãi đặc biệt hôm nay',
        badge: 'Hot nhất tuần',
        name: companions[0]?.name || 'BlackDate',
        tag1: companions[0]?.tags?.[0] || 'Nổi bật',
        tag2: companions[0]?.tags?.[1] || 'Premium',
        rating: `${companions[0]?.rating || '5.0'} (${companions[0]?.reviews || 0})`,
        desc: companions[0]?.desc || '',
        price: '419K',
        unit: '/ 4 giờ',
        oldPrice: '599K',
        countdownSec: 599,
        status: 'active',
      },
    ],
    bookings: bookings.map((item) => ({
      id: item.id,
      customerName: 'Khách Demo',
      phone: '0912345678',
      companion: item.companionName,
      plan: item.plan,
      appointmentAt: `${toIsoDate(item.date)}T${item.time}`,
      meetingPlace: item.place,
      status: item.status,
      total: item.total,
      note: '',
    })),
    reviews: reviews.map((item, index) => ({
      ...item,
      companion: companions[index % companions.length]?.name || '',
      status: 'visible',
    })),
  }
}

export function loadAdminData() {
  if (typeof window === 'undefined') return createDefaultAdminData()

  try {
    const saved = window.localStorage.getItem(ADMIN_DATA_KEY)
    if (!saved) return createDefaultAdminData()
    const parsed = JSON.parse(saved)
    return normalizeAdminData(parsed)
  } catch {
    return createDefaultAdminData()
  }
}

export function saveAdminData(data) {
  window.localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data))
}

export async function loadAdminDataFromApi() {
  const result = await request('/api/app-data')
  if (!result.data) return null
  return normalizeAdminData(result.data)
}

export async function saveAdminDataToApi(data) {
  const result = await request('/api/app-data', {
    method: 'PUT',
    body: JSON.stringify({ data }),
  })
  if (result.data) saveAdminData(result.data)
  return result.data
}

function normalizeAdminData(data) {
  const defaults = createDefaultAdminData()
  const merged = Object.fromEntries(
    Object.entries(defaults).map(([key, value]) => [key, Array.isArray(data?.[key]) ? data[key] : value]),
  )
  merged.companions = merged.companions.map((item, index) => ({
    ...defaults.companions[index],
    ...item,
    fullName: item.fullName || item.name || defaults.companions[index]?.fullName || '',
    birthDate: item.birthDate || defaults.companions[index]?.birthDate || '',
    height: item.height || defaults.companions[index]?.height || '',
    weight: item.weight || defaults.companions[index]?.weight || '',
    measurements: item.measurements || defaults.companions[index]?.measurements || '',
    interests: item.interests || item.tags?.join(', ') || defaults.companions[index]?.interests || '',
  }))
  return localizeLegacyAdminData(merged)
}

function toIsoDate(displayDate) {
  const [day, month, year] = String(displayDate || '').split('/')
  if (!day || !month || !year) return '2026-05-25'
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function localizeLegacyAdminData(value) {
  if (Array.isArray(value)) return value.map(localizeLegacyAdminData)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeLegacyAdminData(item)]))
  }
  if (typeof value !== 'string') return value
  return Object.entries(legacyText)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((text, [legacy, localized]) => text.split(legacy).join(localized), value)
}
