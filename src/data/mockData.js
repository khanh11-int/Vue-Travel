export const categories = [
  { id: 'hotel', name: 'Khách sạn', description: 'Lưu trú nội địa cao cấp và tiện nghi', status: 'active' },
  { id: 'tour', name: 'Tour', description: 'Tour trọn gói khám phá Việt Nam', status: 'active' },
  { id: 'ticket', name: 'Vé tham quan', description: 'Vé vào cổng và trải nghiệm nổi bật', status: 'active' },
  { id: 'combo', name: 'Combo', description: 'Combo khách sạn và trải nghiệm nội địa', status: 'active' }
]

export const destinations = [
  { id: 1, name: 'Hà Nội', province: 'Hà Nội', heroImage: 'https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=80' },
  { id: 2, name: 'Đà Nẵng', province: 'Đà Nẵng', heroImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80' },
  { id: 3, name: 'Hạ Long', province: 'Quảng Ninh', heroImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80' },
  { id: 4, name: 'Đà Lạt', province: 'Lâm Đồng', heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' },
  { id: 5, name: 'Phú Quốc', province: 'Kiên Giang', heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' }
]

export const services = [
  {
    id: 101,
    name: 'Du thuyền Heritage Hạ Long 2N1Đ',
    slug: 'du-thuyen-heritage-ha-long-2n1d',
    categoryId: 'tour',
    destination: 'Hạ Long',
    province: 'Quảng Ninh',
    price: 4200000,
    salePrice: 3590000,
    rating: 4.8,
    availableSlots: 12,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Trải nghiệm du thuyền 5 sao trên vịnh Hạ Long với lịch trình 2 ngày 1 đêm.',
    description: 'Phù hợp cho cặp đôi, gia đình và nhóm bạn muốn khám phá Hạ Long theo phong cách nghỉ dưỡng cao cấp. Gồm phòng nghỉ, bữa ăn, kayak và vé tham quan các điểm nổi bật.',
    amenities: ['Bữa sáng buffet', 'Xe đưa đón Hà Nội - Hạ Long', 'Kayak', 'Hướng dẫn viên tiếng Việt'],
    createdAt: '2026-03-01T10:00:00Z',
    featured: true,
    itinerary: ['Ngày 1: Hà Nội - Hạ Long - Hang Luồn', 'Ngày 2: Hang Sửng Sốt - Tắm biển - Trở về Hà Nội']
  },
  {
    id: 102,
    name: 'InterContinental Đà Nẵng Sun Peninsula Resort',
    slug: 'intercontinental-da-nang-sun-peninsula-resort',
    categoryId: 'hotel',
    destination: 'Đà Nẵng',
    province: 'Đà Nẵng',
    price: 12900000,
    salePrice: 10800000,
    rating: 4.9,
    availableSlots: 5,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Khu nghỉ dưỡng ven biển sang trọng trên bán đảo Sơn Trà.',
    description: 'Resort phù hợp cho kỳ nghỉ dưỡng cao cấp với hồ bơi vô cực, spa, bãi biển riêng và nhà hàng fine dining. Đây là lựa chọn nổi bật cho khách hàng du lịch nội địa muốn nghỉ dưỡng sang trọng.',
    amenities: ['Hồ bơi vô cực', 'Bãi biển riêng', 'Spa', 'Xe điện nội khu'],
    createdAt: '2026-02-25T09:00:00Z',
    featured: true,
    itinerary: ['Nhận phòng từ 14:00', 'Bao gồm bữa sáng', 'Miễn phí xe điện nội khu']
  },
  {
    id: 103,
    name: 'Vé VinWonders Phú Quốc',
    slug: 've-vinwonders-phu-quoc',
    categoryId: 'ticket',
    destination: 'Phú Quốc',
    province: 'Kiên Giang',
    price: 950000,
    salePrice: 790000,
    rating: 4.7,
    availableSlots: 30,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Vé tham quan công viên chủ đề nổi tiếng tại Phú Quốc.',
    description: 'Phù hợp cho gia đình và nhóm bạn với hàng loạt trò chơi, show diễn và công viên nước. Có thể kết hợp cùng safari hoặc combo nghỉ dưỡng.',
    amenities: ['Vé vào cổng', 'Nhiều khu trò chơi', 'Check-in không cần in vé'],
    createdAt: '2026-03-10T08:00:00Z',
    featured: false,
    itinerary: ['Sử dụng trong ngày', 'Áp dụng cho 1 khách', 'Không hoàn hủy sau khi kích hoạt']
  },
  {
    id: 104,
    name: 'Combo Đà Lạt 3N2Đ Khách sạn + City Tour',
    slug: 'combo-da-lat-3n2d-khach-san-city-tour',
    categoryId: 'combo',
    destination: 'Đà Lạt',
    province: 'Lâm Đồng',
    price: 3650000,
    salePrice: 2990000,
    rating: 4.6,
    availableSlots: 16,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Combo tiết kiệm cho kỳ nghỉ Đà Lạt mộng mơ.',
    description: 'Bao gồm khách sạn trung tâm, bữa sáng và city tour các địa điểm nổi tiếng như Hồ Xuân Hương, Thiền Viện Trúc Lâm, đồi chè Cầu Đất.',
    amenities: ['Khách sạn 3 sao', 'Bữa sáng', 'Xe tour tham quan'],
    createdAt: '2026-03-12T13:00:00Z',
    featured: true,
    itinerary: ['Ngày 1: Nhận phòng', 'Ngày 2: City tour Đà Lạt', 'Ngày 3: Tự do mua sắm - trả phòng']
  }
]

export const comments = [
  {
    id: 9001,
    serviceId: 101,
    userName: 'Nguyễn Lan Anh',
    rating: 5,
    content: 'Du thuyền đẹp, đồ ăn ngon và lịch trình hợp lý. Rất đáng thử cho chuyến đi Hạ Long.',
    createdAt: '2026-03-15T08:30:00Z',
    visible: true
  },
  {
    id: 9002,
    serviceId: 101,
    userName: 'Trần Minh Quân',
    rating: 4,
    content: 'Nhân viên hỗ trợ nhiệt tình, phòng sạch đẹp. Chỉ mong thời gian kayak dài hơn.',
    createdAt: '2026-03-16T14:20:00Z',
    visible: true
  }
]

export const promotions = [
  {
    id: 3001,
    code: 'VIETVOYAGE10',
    type: 'percent',
    value: 10,
    description: 'Giảm 10% cho booking nội địa',
    status: 'active',
    startDate: '2026-03-01',
    endDate: '2026-12-31'
  },
  {
    id: 3002,
    code: 'PHUQUOC500K',
    type: 'amount',
    value: 500000,
    description: 'Giảm 500.000đ cho đơn từ 5.000.000đ',
    status: 'active',
    startDate: '2026-03-01',
    endDate: '2026-09-30'
  }
]

export const adminSummary = {
  totalServices: services.length,
  totalBookings: 128,
  monthlyRevenue: 485000000,
  pendingBookings: 16,
  lowStockServices: services.filter((service) => service.availableSlots <= 5),
  revenueSeries: [120, 180, 220, 260, 300, 280, 340],
  bookingSeries: [8, 14, 16, 21, 24, 20, 28]
}