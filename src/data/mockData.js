export const categories = [
  { id: 'hotel', name: 'Khách sạn', description: 'Lưu trú nội địa cao cấp và tiện nghi', status: 'active' },
  { id: 'tour', name: 'Tour', description: 'Tour trọn gói khám phá Việt Nam', status: 'active' },
  { id: 'ticket', name: 'Vé tham quan', description: 'Vé vào cổng và trải nghiệm nổi bật', status: 'active' },
  { id: 'combo', name: 'Combo', description: 'Combo khách sạn và trải nghiệm nội địa', status: 'active' }
]

export const destinations = [
  { id: 1, name: 'Hà Nội', province: 'Hà Nội', heroImage: 'https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=80' },
  { id: 2, name: 'TP.HCM', province: 'TP.HCM', heroImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80' },
  { id: 3, name: 'Đà Nẵng', province: 'Đà Nẵng', heroImage: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80' },
  { id: 4, name: 'Hạ Long', province: 'Quảng Ninh', heroImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80' },
  { id: 5, name: 'Đà Lạt', province: 'Lâm Đồng', heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' },
  { id: 6, name: 'Phú Quốc', province: 'Kiên Giang', heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
  { id: 7, name: 'Nha Trang', province: 'Khánh Hòa', heroImage: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80' },
  { id: 8, name: 'Hội An', province: 'Quảng Nam', heroImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80' },
  { id: 9, name: 'Sapa', province: 'Lào Cai', heroImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80' },
  { id: 10, name: 'Cần Thơ', province: 'Cần Thơ', heroImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80' }
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
      },
  {
    id: 105,
    name: 'Khách sạn phố cổ Hà Nội 2N1Đ',
    slug: 'khach-san-pho-co-ha-noi-2n1d',
    categoryId: 'hotel',
    destination: 'Hà Nội',
    province: 'Hà Nội',
    price: 2100000,
    salePrice: 1690000,
    rating: 4.5,
    availableSlots: 18,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Khách sạn trung tâm gần Hồ Gươm, phù hợp cho gia đình và cặp đôi.',
    description: 'Dịch vụ lưu trú tại trung tâm Hà Nội với thiết kế hiện đại, tiện di chuyển tới Hồ Gươm, phố cổ và các khu ẩm thực nổi tiếng.',
    amenities: ['Bữa sáng', 'Đưa đón sân bay', 'Miễn phí wifi', 'Quầy hỗ trợ 24/7'],
    createdAt: '2026-03-14T08:00:00Z',
    featured: true,
    itinerary: ['Nhận phòng từ 14:00', 'Trả phòng trước 12:00', 'Miễn phí buffet sáng']
  },
  {
    id: 106,
    name: 'Tour Hội An - Bà Nà - Đà Nẵng 3N2Đ',
    slug: 'tour-hoi-an-ba-na-da-nang-3n2d',
    categoryId: 'tour',
    destination: 'Hội An',
    province: 'Quảng Nam',
    price: 4890000,
    salePrice: 4250000,
    rating: 4.9,
    availableSlots: 9,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Khám phá phố cổ Hội An, Bà Nà Hills và biển Mỹ Khê trong 3 ngày.',
    description: 'Tour phù hợp cho nhóm bạn hoặc gia đình muốn trải nghiệm di sản, ẩm thực miền Trung và nghỉ dưỡng biển trong một hành trình ngắn ngày.',
    amenities: ['Khách sạn 3 sao', 'Xe đưa đón', 'Ăn sáng', 'Vé tham quan theo lịch trình'],
    createdAt: '2026-03-17T09:00:00Z',
    featured: true,
    itinerary: ['Ngày 1: Đà Nẵng - Hội An', 'Ngày 2: Bà Nà Hills', 'Ngày 3: Biển Mỹ Khê - mua sắm']
  },
  {
    id: 107,
    name: 'Vé cáp treo Fansipan Sapa',
    slug: 've-cap-treo-fansipan-sapa',
    categoryId: 'ticket',
    destination: 'Sapa',
    province: 'Lào Cai',
    price: 850000,
    salePrice: 720000,
    rating: 4.6,
    availableSlots: 40,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Trải nghiệm cáp treo chinh phục đỉnh Fansipan cho chuyến đi Sapa.',
    description: 'Vé điện tử tiện lợi dành cho khách du lịch nội địa muốn khám phá Sapa và tận hưởng cảnh núi non Tây Bắc hùng vĩ.',
    amenities: ['Vé điện tử', 'Check-in nhanh', 'Hỗ trợ khách Việt'],
    createdAt: '2026-03-18T10:00:00Z',
    featured: false,
    itinerary: ['Sử dụng trong ngày', 'Áp dụng cho 1 khách', 'Không áp dụng hoàn tiền sau khi kích hoạt']
  },
  {
    id: 108,
    name: 'Combo nghỉ dưỡng Nha Trang 3N2Đ',
    slug: 'combo-nghi-duong-nha-trang-3n2d',
    categoryId: 'combo',
    destination: 'Nha Trang',
    province: 'Khánh Hòa',
    price: 4390000,
    salePrice: 3790000,
    rating: 4.7,
    availableSlots: 11,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Combo khách sạn ven biển, buffet sáng và tour đảo mini tại Nha Trang.',
    description: 'Lựa chọn phù hợp cho cặp đôi và gia đình muốn nghỉ dưỡng biển với chi phí tối ưu và trải nghiệm trọn gói.',
    amenities: ['Khách sạn 4 sao', 'Buffet sáng', 'Đưa đón sân bay', 'Tour đảo mini'],
    createdAt: '2026-03-18T14:00:00Z',
    featured: true,
    itinerary: ['Ngày 1: Nhận phòng', 'Ngày 2: Tour đảo mini', 'Ngày 3: Tự do tắm biển - trả phòng']
  },
  {
    id: 109,
    name: 'Tour chợ nổi Cái Răng Cần Thơ',
    slug: 'tour-cho-noi-cai-rang-can-tho',
    categoryId: 'tour',
    destination: 'Cần Thơ',
    province: 'Cần Thơ',
    price: 1250000,
    salePrice: 990000,
    rating: 4.4,
    availableSlots: 22,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Khám phá chợ nổi miền Tây và văn hóa sông nước Cần Thơ trong ngày.',
    description: 'Tour trong ngày dành cho khách hàng muốn trải nghiệm đời sống sông nước, thưởng thức trái cây và đặc sản miền Tây.',
    amenities: ['Tàu tham quan', 'Bữa sáng nhẹ', 'Hướng dẫn viên', 'Nước uống'],
    createdAt: '2026-03-19T07:30:00Z',
    featured: false,
    itinerary: ['05:00 đón khách', 'Tham quan chợ nổi Cái Răng', 'Ăn sáng trên thuyền', 'Kết thúc lúc 10:30']
  },
  {
    id: 110,
    name: 'Khách sạn trung tâm Quận 1 TP.HCM',
    slug: 'khach-san-trung-tam-quan-1-tphcm',
    categoryId: 'hotel',
    destination: 'TP.HCM',
    province: 'TP.HCM',
    price: 2800000,
    salePrice: 2290000,
    rating: 4.3,
    availableSlots: 14,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Khách sạn hiện đại gần phố đi bộ Nguyễn Huệ và chợ Bến Thành.',
    description: 'Điểm lưu trú phù hợp cho khách công tác kết hợp du lịch, thuận tiện tham quan trung tâm TP.HCM và các điểm ăn uống về đêm.',
    amenities: ['Buffet sáng', 'Phòng gym', 'Đưa đón sân bay', 'Hỗ trợ check-in sớm'],
    createdAt: '2026-03-19T11:00:00Z',
    featured: false,
    itinerary: ['Nhận phòng từ 14:00', 'Trả phòng trước 12:00', 'Miễn phí buffet sáng']
    },
  {
    id: 111,
    name: 'Tour Hà Nội - Ninh Bình Tràng An 1 ngày',
    slug: 'tour-ha-noi-ninh-binh-trang-an-1-ngay',
    categoryId: 'tour',
    destination: 'Hà Nội',
    province: 'Hà Nội',
    price: 1450000,
    salePrice: 1190000,
    rating: 4.7,
    availableSlots: 26,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Khởi hành từ Hà Nội, khám phá Tràng An, chùa Bái Đính và đặc sản dê núi.',
    description: 'Tour trong ngày dành cho khách muốn đổi gió cuối tuần với lịch trình gọn nhẹ, có xe đưa đón, ăn trưa và vé thắng cảnh nổi bật của Ninh Bình.',
    amenities: ['Xe limousine', 'Ăn trưa', 'Vé thắng cảnh', 'Hướng dẫn viên'],
    createdAt: '2026-03-20T08:00:00Z',
    featured: false,
    itinerary: ['07:30 đón khách tại Hà Nội', '10:00 tham quan Bái Đính', '13:30 chèo thuyền Tràng An', '19:00 về lại Hà Nội']
  },
  {
    id: 112,
    name: 'Combo Phú Quốc 4N3Đ Resort + Grand World',
    slug: 'combo-phu-quoc-4n3d-resort-grand-world',
    categoryId: 'combo',
    destination: 'Phú Quốc',
    province: 'Kiên Giang',
    price: 6990000,
    salePrice: 5990000,
    rating: 4.8,
    availableSlots: 13,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Combo nghỉ dưỡng biển dài ngày kèm vé tham quan Grand World Phú Quốc.',
    description: 'Phù hợp cho cặp đôi và gia đình muốn ở resort ven biển, tặng xe đón sân bay và một buổi khám phá Grand World về đêm.',
    amenities: ['Resort 4 sao', 'Đưa đón sân bay', 'Buffet sáng', 'Vé Grand World'],
    createdAt: '2026-03-20T10:00:00Z',
    featured: true,
    itinerary: ['Ngày 1: Đón sân bay - nhận phòng', 'Ngày 2: Tự do tắm biển', 'Ngày 3: Grand World Phú Quốc', 'Ngày 4: Trả phòng']
  },
  {
    id: 113,
    name: 'Vé Sun World Bà Nà Hills kèm buffet trưa',
    slug: 've-sun-world-ba-na-hills-kem-buffet-trua',
    categoryId: 'ticket',
    destination: 'Đà Nẵng',
    province: 'Đà Nẵng',
    price: 1250000,
    salePrice: 1090000,
    rating: 4.8,
    availableSlots: 35,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Vé cáp treo Bà Nà Hills đi trong ngày, đã gồm buffet trưa tại khu làng Pháp.',
    description: 'Phù hợp cho khách đi tự túc tại Đà Nẵng, ưu tiên check-in nhanh và tiết kiệm thời gian xếp hàng mua vé tại quầy.',
    amenities: ['Vé điện tử', 'Buffet trưa', 'Check-in nhanh', 'Hỗ trợ đổi ngày linh hoạt'],
    createdAt: '2026-03-20T12:00:00Z',
    featured: false,
    itinerary: ['Sử dụng trong ngày', 'Bao gồm buffet trưa', 'Không bao gồm xe đưa đón']
  },
  {
    id: 114,
    name: 'Resort ven hồ Đà Lạt 2N1Đ',
    slug: 'resort-ven-ho-da-lat-2n1d',
    categoryId: 'hotel',
    destination: 'Đà Lạt',
    province: 'Lâm Đồng',
    price: 3250000,
    salePrice: 2790000,
    rating: 4.6,
    availableSlots: 8,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Khu nghỉ dưỡng yên tĩnh nhìn ra hồ Tuyền Lâm, thích hợp nghỉ dưỡng cuối tuần.',
    description: 'Không gian biệt lập với khí hậu mát mẻ, phù hợp cho khách muốn nghỉ ngơi, thưởng trà chiều và tham gia các hoạt động nhẹ ngoài trời.',
    amenities: ['Ăn sáng', 'Trà chiều', 'Xe điện nội khu', 'Thuê xe đạp'],
    createdAt: '2026-03-20T15:30:00Z',
    featured: false,
    itinerary: ['Nhận phòng từ 14:00', 'Tặng trà chiều', 'Trả phòng trước 12:00']
  },
  {
    id: 115,
    name: 'Tour du thuyền sông Sài Gòn ăn tối',
    slug: 'tour-du-thuyen-song-sai-gon-an-toi',
    categoryId: 'tour',
    destination: 'TP.HCM',
    province: 'TP.HCM',
    price: 1650000,
    salePrice: 1350000,
    rating: 4.5,
    availableSlots: 20,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Trải nghiệm ăn tối trên du thuyền sông Sài Gòn với nhạc sống và ngắm skyline thành phố.',
    description: 'Sản phẩm phù hợp cho cặp đôi, khách công tác hoặc gia đình muốn có một buổi tối đặc biệt ngay tại trung tâm TP.HCM.',
    amenities: ['Set menu tối', 'Nhạc acoustic', 'Bàn ngắm cảnh', 'Hỗ trợ chụp ảnh'],
    createdAt: '2026-03-20T18:00:00Z',
    featured: false,
    itinerary: ['18:30 check-in bến tàu', '19:00 khởi hành', '20:30 biểu diễn nhạc sống', '21:15 cập bến']
  },
  {
    id: 116,
    name: 'Vé phố cổ Hội An show Ký Ức Hội An',
    slug: 've-pho-co-hoi-an-show-ky-uc-hoi-an',
    categoryId: 'ticket',
    destination: 'Hội An',
    province: 'Quảng Nam',
    price: 980000,
    salePrice: 820000,
    rating: 4.7,
    availableSlots: 28,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Vé tham quan phố cổ buổi tối kết hợp xem show Ký Ức Hội An.',
    description: 'Lựa chọn lý tưởng cho khách muốn trải nghiệm Hội An về đêm, kết hợp tham quan, chụp ảnh và theo dõi chương trình biểu diễn thực cảnh nổi tiếng.',
    amenities: ['Vé show', 'Vé tham quan phố cổ', 'Ghế khu tiêu chuẩn', 'Xác nhận tức thì'],
    createdAt: '2026-03-21T08:30:00Z',
    featured: false,
    itinerary: ['Nhận vé điện tử', 'Tự do tham quan phố cổ', '19:30 vào cổng show', 'Kết thúc lúc 20:45']
  },
  {
    id: 117,
    name: 'Combo Sapa 3N2Đ khách sạn + xe cabin đôi',
    slug: 'combo-sapa-3n2d-khach-san-xe-cabin-doi',
    categoryId: 'combo',
    destination: 'Sapa',
    province: 'Lào Cai',
    price: 3950000,
    salePrice: 3350000,
    rating: 4.6,
    availableSlots: 17,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Combo tiện lợi cho chuyến đi Sapa tự túc với xe cabin đôi và khách sạn trung tâm.',
    description: 'Phù hợp cho nhóm bạn trẻ hoặc cặp đôi, đã bao gồm xe khứ hồi, 2 đêm khách sạn và gợi ý lịch trình check-in bản Cát Cát, nhà thờ đá, Fansipan.',
    amenities: ['Xe cabin đôi khứ hồi', 'Khách sạn 3 sao', 'Ăn sáng', 'Hỗ trợ giữ hành lý'],
    createdAt: '2026-03-21T10:30:00Z',
    featured: true,
    itinerary: ['Đêm 1: Khởi hành từ Hà Nội', 'Ngày 1: Nhận phòng - bản Cát Cát', 'Ngày 2: Fansipan tự túc', 'Ngày 3: Tự do mua sắm - về Hà Nội']
  },
  {
    id: 118,
    name: 'Khách sạn boutique Cần Thơ bến Ninh Kiều',
    slug: 'khach-san-boutique-can-tho-ben-ninh-kieu',
    categoryId: 'hotel',
    destination: 'Cần Thơ',
    province: 'Cần Thơ',
    price: 2350000,
    salePrice: 1890000,
    rating: 4.4,
    availableSlots: 10,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
    ],
    shortDescription: 'Khách sạn boutique gần bến Ninh Kiều, thuận tiện khám phá chợ đêm và ẩm thực miền Tây.',
    description: 'Không gian lưu trú nhỏ xinh, dịch vụ thân thiện, phù hợp cho du khách muốn nghỉ ngơi ở trung tâm và dễ di chuyển ra bến tàu chợ nổi.',
    amenities: ['Ăn sáng', 'Cho thuê xe máy', 'Quầy tour', 'Wifi tốc độ cao'],
    createdAt: '2026-03-21T13:00:00Z',
    featured: false,
    itinerary: ['Nhận phòng từ 14:00', 'Gợi ý tour chợ nổi sáng sớm', 'Trả phòng trước 12:00']
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
      },
  {
    id: 9003,
    serviceId: 108,
    userName: 'Lê Thu Trang',
    rating: 5,
    content: 'Combo Nha Trang rất đáng tiền, phòng đẹp và tour đảo tổ chức chuyên nghiệp.',
    createdAt: '2026-03-18T16:20:00Z',
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
     },
  {
    id: 3003,
    code: 'HEVN2026',
    type: 'percent',
    value: 15,
    description: 'Ưu đãi hè cho các điểm đến biển Việt Nam',
    status: 'active',
    startDate: '2026-04-01',
    endDate: '2026-08-31'
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