<template>
  <section class="admin-page">
    <div class="panel-card">
      <div class="section-heading compact admin-heading-stack">
        <div>
          <p class="eyebrow">Quản lý dịch vụ</p>
          <h2>{{ isCreatePage ? 'Thêm dịch vụ du lịch nội địa Việt Nam' : 'Dịch vụ du lịch nội địa Việt Nam' }}</h2>
          <p class="muted small-text">{{ isCreatePage ? 'Điền thông tin dịch vụ theo từng bước rồi xác nhận lưu.' : 'Chọn loại dịch vụ trước, sau đó điền thông tin và ảnh đại diện theo từng khối để dễ kiểm tra.' }}</p>
        </div>
        <button v-if="!isCreatePage" class="primary-button" type="button" @click="startCreateService">+ Thêm dịch vụ</button>
        <button v-else class="secondary-button" type="button" @click="goToServicesList">Quay lại danh sách</button>
      </div>

      <div v-if="!isCreatePage" class="admin-category-tabs">
        <button
          v-for="category in categoryTabs"
          :key="category.id"
          type="button"
          :class="['admin-category-tab', { active: filters.categoryId === category.id }]"
          @click="filters.categoryId = category.id"
        >
          {{ category.name }}
        </button>
        <button type="button" :class="['admin-category-tab', { active: !filters.categoryId }]" @click="filters.categoryId = ''">
          Tất cả
        </button>
      </div>

      <div v-if="!isCreatePage" class="admin-toolbar">
        <input v-model="filters.keyword" type="text" placeholder="Tìm theo tên dịch vụ hoặc điểm đến" />
        <select v-model="filters.province">
          <option value="">Tất cả tỉnh/thành</option>
          <option v-for="province in provinceOptions" :key="province" :value="province">
            {{ province }}
          </option>
        </select>
      </div>

      <div v-if="isCreatePage || isEditing" class="service-form-steps">
        <div
          v-for="item in stepItems"
          :key="item.step"
          :class="['service-form-step', { active: wizardStep === item.step, done: wizardStep > item.step }]"
        >
          <strong>{{ item.step }}</strong>
          <div>
            <p>{{ item.title }}</p>
            <span>{{ item.description }}</span>
          </div>
        </div>
      </div>

      <div v-if="(isCreatePage || isEditing) && wizardStep === 1" class="service-form-legend">
        <div>
          <p class="eyebrow">Loại dịch vụ</p>
          <h3>Chọn nhóm phù hợp cho dữ liệu đang nhập</h3>
          <p class="muted small-text">Sau khi chọn loại dịch vụ, hệ thống sẽ chuyển sang bước nhập thông tin chi tiết.</p>
        </div>
        <div class="service-category-tabs" role="tablist" aria-label="Loại dịch vụ">
          <button
            v-for="category in categoryTabs"
            :key="category.id"
            type="button"
            :class="['service-category-tab', { active: serviceForm.categoryId === category.id }]"
            @click="selectServiceCategory(category.id)"
          >
            <span>{{ category.name }}</span>
            <small>{{ getCategoryHint(category.id) }}</small>
          </button>
        </div>
      </div>

      <div v-if="isCreatePage || isEditing" class="admin-form-grid">
        <section v-if="wizardStep === 2" class="service-form-section admin-form-span-2">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">Thông tin cơ bản</p>
              <h3>Tên, giá, mô tả và tiện ích</h3>
              <p class="muted small-text">Nhập thông tin nhận diện, giá bán và nội dung mô tả trong cùng một khối để kiểm tra dễ hơn.</p>
            </div>
            <span class="service-form-badge">{{ currentCategoryLabel }}</span>
          </div>

          <div class="service-form-tip">
            <strong>Gợi ý nhập nhanh:</strong>
            <span>Tên và slug nên đồng nhất, giá gốc luôn lớn hơn hoặc bằng giá khuyến mãi, và số chỗ còn lại nên phản ánh tồn kho thực tế.</span>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>1) Định danh dịch vụ</h4>
              <p class="muted small-text">Các trường này quyết định cách dịch vụ hiển thị và định tuyến.</p>
            </div>
            <div class="admin-form-grid service-form-grid">
              <div class="field-group">
                <label>Tên dịch vụ</label>
                <input v-model="serviceForm.name" type="text" placeholder="Ví dụ: Tour Hạ Long 3N2Đ" />
              </div>
              <div class="field-group">
                <label>Đường dẫn slug</label>
                <input v-model="serviceForm.slug" type="text" placeholder="tour-ha-long-3n2d" />
              </div>
            </div>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>2) Địa điểm</h4>
              <p class="muted small-text">Dùng để lọc theo tỉnh/thành và gợi ý tìm kiếm cho khách.</p>
            </div>
            <div class="admin-form-grid service-form-grid">
              <div class="field-group">
                <label>Điểm đến</label>
                <input v-model="serviceForm.destination" type="text" placeholder="Ví dụ: Hạ Long" />
              </div>
              <div class="field-group">
                <label>Tỉnh / thành</label>
                <input v-model="serviceForm.province" type="text" placeholder="Ví dụ: Quảng Ninh" />
              </div>
            </div>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>3) Giá và tồn chỗ</h4>
              <p class="muted small-text">Giá gốc (price) là giá chính, phần trăm giảm giá sẽ tự động tính giá sau giảm.</p>
            </div>
            <div class="admin-form-grid service-form-grid">
              <div class="field-group">
                <label>Giá gốc</label>
                <input v-model.number="serviceForm.price" type="number" min="0" placeholder="0" />
              </div>
              <div class="field-group">
                <label>Phần trăm giảm giá (%)</label>
                <input v-model.number="serviceForm.discountPercent" type="number" min="0" max="100" placeholder="0" />
              </div>
            </div>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>4) Mô tả chi tiết (hiển thị trên trang chi tiết)</h4>
              <p class="muted small-text">Chi tiết đầy đủ, điều kiện, lưu ý, qui tắc hủy bỏ...</p>
            </div>
            <div class="field-group">
              <label>Mô tả chi tiết</label>
              <textarea v-model="serviceForm.detailedDescription" rows="5" placeholder="Mô tả chi tiết, điều kiện, lưu ý, qui tắc hủy, v.v..." />
            </div>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>5) Tiện ích nổi bật</h4>
              <p class="muted small-text">Các tính năng / tiện ích chính (cách nhau bằng dấu phẩy hoặc xuống dòng).</p>
            </div>
            <div class="field-group">
              <label>Tiện ích nổi bật</label>
              <textarea v-model="serviceForm.highlightedFeatures" rows="4" placeholder="Ví dụ: Ăn sáng hàng ngày, Thuyền du ngoạn, Hướng dẫn viên tiếng Việt, WiFi miễn phí" />
            </div>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>6) Lịch trình / Thông tin hành trình</h4>
              <p class="muted small-text">Tóm tắt lịch trình hoặc thông tin chính của dịch vụ.</p>
            </div>
            <div class="field-group">
              <label>Lịch trình / Thông tin hành trình</label>
              <textarea v-model="serviceForm.scheduleInfo" rows="4" placeholder="Ví dụ: Ngày 1: TP.HCM → Hạ Long. Ngày 2: Thuyền du ngoạn. Ngày 3: Hạ Long → TP.HCM" />
            </div>
          </div>

          <div class="admin-form-actions">
            <button class="secondary-button" type="button" @click="goToStep(1)">Trở về</button>
            <button class="primary-button" type="button" @click="goToStepThree">Tiếp tục</button>
          </div>
        </section>

        <section v-if="wizardStep === 4 && serviceForm.categoryId === 'hotel'" class="service-form-section admin-form-span-2">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">Thiết lập khách sạn</p>
              <h3>Loại phòng và phụ thu trẻ em</h3>
              <p class="muted small-text">Khách sạn cần danh sách loại phòng để trang chi tiết tính đúng giá người lớn và phụ thu trẻ em.</p>
            </div>
            <span class="service-form-hint">Cấu hình phòng</span>
          </div>

          <div class="service-model-list">
            <div v-for="(roomType, index) in roomTypes" :key="`${roomType.value}-${index}`" class="service-model-item">
              <div class="service-model-item__header">
                <strong>Loại phòng {{ index + 1 }}</strong>
                <button class="ghost-button" type="button" :disabled="roomTypes.length === 1" @click="removeRoomType(index)">Xóa</button>
              </div>

              <div class="admin-form-grid service-form-grid">
                <div class="field-group">
                  <label>Mã loại phòng</label>
                  <input v-model="roomType.value" type="text" placeholder="standard" />
                </div>
                <div class="field-group">
                  <label>Tên hiển thị</label>
                  <input v-model="roomType.label" type="text" placeholder="Phòng tiêu chuẩn" />
                </div>
                <div class="field-group">
                  <label>Hệ số giá</label>
                  <input v-model.number="roomType.priceMultiplier" type="number" min="0.8" step="0.01" />
                </div>
                <div class="field-group">
                  <label>Phụ thu trẻ em / đêm</label>
                  <input v-model.number="roomType.childSurcharge" type="number" min="0" step="1000" />
                </div>
                <div class="field-group">
                  <label>Số chỗ loại phòng</label>
                  <input v-model.number="roomType.availableSlots" type="number" min="0" />
                </div>
              </div>
            </div>
          </div>

          <button class="ghost-button" type="button" @click="addRoomType">+ Thêm loại phòng</button>

          <div class="admin-form-actions">
            <button class="secondary-button" type="button" @click="goToStep(3)">Trở về</button>
            <button class="primary-button" type="button" @click="goToReviewStep">Tiếp tục</button>
          </div>
        </section>

        <section v-else-if="wizardStep === 4 && serviceForm.categoryId === 'tour'" class="service-form-section admin-form-span-2">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">Thiết lập tour</p>
              <h3>Lịch, chính sách trẻ em và bảng giá</h3>
              <p class="muted small-text">Tour cần lịch khởi hành, kiểu lịch và bảng giá để trang chi tiết hoạt động đúng.</p>
            </div>
            <span class="service-form-hint">Cấu hình tour</span>
          </div>

          <div class="service-form-tip">
            <strong>Gợi ý nhập tour:</strong>
            <span>Đi theo thứ tự từ trái sang phải: kiểu lịch - chính sách trẻ em - bảng giá - lịch khởi hành để tránh thiếu thông tin.</span>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>1) Kiểu lịch tour</h4>
              <p class="muted small-text">Thiết lập cách mở lịch: cố định, linh hoạt hoặc kết hợp.</p>
            </div>
            <div class="admin-form-grid service-form-grid">
              <div class="field-group admin-form-span-2">
                <label>Kiểu lịch tour</label>
                <select v-model="tourScheduleType">
                  <option value="fixed">Lịch cố định</option>
                  <option value="flexible">Lịch linh hoạt</option>
                  <option value="hybrid">Kết hợp cố định và linh hoạt</option>
                </select>
              </div>
              <div class="field-group">
                <label>Ngày bắt đầu nhận lịch linh hoạt</label>
                <input v-model="tourFlexibleStart" type="date" />
              </div>
              <div class="field-group">
                <label>Ngày kết thúc nhận lịch linh hoạt</label>
                <input v-model="tourFlexibleEnd" type="date" />
              </div>
            </div>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>2) Chính sách trẻ em</h4>
              <p class="muted small-text">Dùng cho tính giá tự động tại trang chi tiết tour.</p>
            </div>
            <div class="admin-form-grid service-form-grid">
              <div class="field-group">
                <label>Miễn phí cho trẻ dưới</label>
                <input v-model.number="tourChildPolicy.freeUnderAge" type="number" min="0" />
              </div>
              <div class="field-group">
                <label>Tỷ lệ giá trẻ em/Phụ thu trẻ em</label>
                <input v-model.number="tourChildPolicy.childRate" type="number" min="0" max="1" step="0.05" />
              </div>
              <div class="field-group">
                <label>Tuổi tính như người lớn</label>
                <input v-model.number="tourChildPolicy.adultAgeThreshold" type="number" min="0" />
              </div>
            </div>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>3) Bảng giá tour</h4>
              <p class="muted small-text">Khai báo riêng cho lịch cố định và lịch linh hoạt.</p>
            </div>

            <div class="tour-pricing-grid">
              <div class="tour-pricing-card">
                <h5>Bảng giá lịch cố định</h5>
                <div class="admin-form-grid service-form-grid">
                  <div class="field-group">
                    <label>Nhãn lịch cố định</label>
                    <input v-model="tourPricingTiers.fixed.label" type="text" />
                  </div>
                  <div class="field-group">
                    <label>Giá người lớn</label>
                    <input v-model.number="tourPricingTiers.fixed.adultPrice" type="number" min="0" />
                  </div>
                  <div class="field-group">
                    <label>Giá trẻ em</label>
                    <input v-model.number="tourPricingTiers.fixed.childPrice" type="number" min="0" />
                  </div>
                  <div class="field-group">
                    <label>Ghi chú lịch cố định</label>
                    <input v-model="tourPricingTiers.fixed.note" type="text" />
                  </div>
                </div>
              </div>

              <div class="tour-pricing-card">
                <h5>Bảng giá lịch linh hoạt</h5>
                <div class="admin-form-grid service-form-grid">
                  <div class="field-group">
                    <label>Nhãn lịch linh hoạt</label>
                    <input v-model="tourPricingTiers.flexible.label" type="text" />
                  </div>
                  <div class="field-group">
                    <label>Giá người lớn</label>
                    <input v-model.number="tourPricingTiers.flexible.adultPrice" type="number" min="0" />
                  </div>
                  <div class="field-group">
                    <label>Giá trẻ em</label>
                    <input v-model.number="tourPricingTiers.flexible.childPrice" type="number" min="0" />
                  </div>
                  <div class="field-group">
                    <label>Ghi chú lịch linh hoạt</label>
                    <input v-model="tourPricingTiers.flexible.note" type="text" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>4) Lịch khởi hành</h4>
              <p class="muted small-text">Mỗi lịch gồm mã lịch, ngày đi về và số chỗ còn lại.</p>
            </div>

            <div class="service-model-list">
              <div v-for="(departure, index) in tourDepartures" :key="`${departure.departureId}-${index}`" class="service-model-item">
                <div class="service-model-item__header">
                  <strong>Lịch {{ index + 1 }}</strong>
                  <button class="ghost-button" type="button" :disabled="tourDepartures.length === 1" @click="removeTourDeparture(index)">Xóa</button>
                </div>

                <div class="admin-form-grid service-form-grid">
                  <div class="field-group">
                    <label>Loại hành trình</label>
                    <select v-model="departure.durationPreset" @change="handleDeparturePresetChange(departure)">
                      <option v-for="option in tourDurationOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                  </div>
                  <div class="field-group">
                    <label>Mã lịch</label>
                    <input v-model="departure.departureId" type="text" placeholder="T001-2026-07-20" />
                  </div>
                  <div class="field-group">
                    <label>Ngày đi</label>
                    <input v-model="departure.startDate" type="date" @change="handleDepartureStartDateChange(departure)" />
                  </div>
                  <div class="field-group">
                    <label>Ngày về</label>
                    <input v-model="departure.endDate" type="date" readonly />
                    <small class="muted small-text">Tự động tính theo ngày đi và loại hành trình.</small>
                  </div>
                  <div class="field-group">
                    <label>Còn chỗ</label>
                    <input v-model.number="departure.remainingSlots" type="number" min="0" />
                  </div>
                </div>
              </div>
            </div>
            <button class="ghost-button" type="button" @click="addTourDeparture">+ Thêm lịch khởi hành</button>

          <div class="admin-form-actions">
            <button class="secondary-button" type="button" @click="goToStep(4)">Trở về</button>
            <button class="primary-button" type="button" @click="goToReviewStep">Tiếp tục</button>
          </div>
          </div>
        </section>

        <section v-else-if="wizardStep === 4 && serviceForm.categoryId === 'ticket'" class="service-form-section admin-form-span-2">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">Thiết lập vé tham quan</p>
              <h3>Loại vé, chính sách trẻ em và gói vé</h3>
              <p class="muted small-text">Vé tham quan cần loại vé, chính sách trẻ em và các gói vé để hiển thị đúng bảng giá.</p>
            </div>
            <span class="service-form-hint">Cấu hình vé</span>
          </div>

          <div class="service-form-tip">
            <strong>Gợi ý nhập vé:</strong>
            <span>Đi theo 3 bước: chọn loại dịch vụ vé, khai báo chính sách trẻ em, rồi thiết lập các gói vé (giá gốc, giá bán, tiện ích).</span>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>1) Loại dịch vụ vé</h4>
              <p class="muted small-text">Tên loại vé sẽ hiển thị tại trang chi tiết và dùng để định vị ngữ cảnh sản phẩm.</p>
            </div>
            <div class="admin-form-grid service-form-grid">
              <div class="field-group admin-form-span-2">
                <label>Loại dịch vụ vé</label>
                <input v-model="ticketServiceType" type="text" placeholder="Ví dụ: Công viên giải trí" />
              </div>
            </div>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>2) Chính sách trẻ em</h4>
              <p class="muted small-text">Thiết lập độ tuổi miễn phí, phụ thu và tuổi tính như người lớn.</p>
            </div>

            <div class="admin-form-grid service-form-grid">
              <div class="field-group">
                <label>Miễn phí cho trẻ dưới</label>
                <input v-model.number="ticketChildPolicy.freeUnderAge" type="number" min="0" />
              </div>
              <div class="field-group">
                <label>Tuổi tính như người lớn</label>
                <input v-model.number="ticketChildPolicy.adultAgeThreshold" type="number" min="0" />
              </div>
              <div class="field-group">
                <label>Tuổi bắt đầu phụ thu</label>
                <input v-model.number="ticketChildPolicy.surchargeAgeMin" type="number" min="0" />
              </div>
              <div class="field-group admin-form-span-2">
                <label>Mức phụ thu trẻ em</label>
                <input v-model.number="ticketChildPolicy.surcharge" type="number" min="0" />
              </div>
            </div>

            <p class="service-form-inline-note">{{ ticketPolicySummary }}</p>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>3) Cấu hình gói vé</h4>
              <p class="muted small-text">Mỗi gói có mã riêng, giá riêng và danh sách tiện ích đi kèm.</p>
            </div>

            <div class="service-model-list">
              <div v-for="(ticketPackage, index) in ticketPackages" :key="`${ticketPackage.id}-${index}`" class="service-model-item ticket-package-card">
                <div class="service-model-item__header">
                  <strong>Gói {{ index + 1 }}</strong>
                  <button class="ghost-button" type="button" :disabled="ticketPackages.length === 1" @click="removeTicketPackage(index)">Xóa</button>
                </div>

                <div class="admin-form-grid service-form-grid">
                  <div class="field-group">
                    <label>Mã gói</label>
                    <input v-model="ticketPackage.id" type="text" placeholder="entry" />
                  </div>
                  <div class="field-group">
                    <label>Tên gói</label>
                    <input v-model="ticketPackage.name" type="text" placeholder="Gói vào cổng" />
                  </div>
                  <div class="field-group">
                    <label>Giá khuyến mãi</label>
                    <input v-model.number="ticketPackage.salePrice" type="number" min="0" />
                  </div>
                  <div class="field-group">
                    <label>Giá gốc</label>
                    <input v-model.number="ticketPackage.price" type="number" min="0" />
                  </div>
                  <div class="field-group">
                    <label>Phụ thu trẻ em</label>
                    <input v-model.number="ticketPackage.childSurcharge" type="number" min="0" />
                  </div>
                  <div class="field-group">
                    <label>Số chỗ gói vé</label>
                    <input v-model.number="ticketPackage.availableSlots" type="number" min="0" />
                  </div>
                  <div class="field-group">
                    <label>Tiện ích gói vé (cách nhau bằng dấu phẩy)</label>
                    <input v-model="ticketPackage.featuresText" type="text" placeholder="Vé vào cổng, Không gồm khu trò chơi mở rộng" />
                  </div>
                </div>
              </div>
            </div>

            <button class="ghost-button" type="button" @click="addTicketPackage">+ Thêm gói vé</button>

          <div class="admin-form-actions">
            <button class="secondary-button" type="button" @click="goToStep(3)">Trở về</button>
            <button class="primary-button" type="button" @click="goToReviewStep">Tiếp tục</button>
          </div>
          </div>
        </section>

        <section v-if="wizardStep === 3" class="service-form-section admin-form-span-2">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">Ảnh dịch vụ</p>
              <h3>Thêm nhiều ảnh để hiển thị dịch vụ</h3>
              <p class="muted small-text">Có thể dán link ảnh hoặc chọn file. Thêm được nhiều ảnh làm bộ sưu tập.</p>
            </div>
            <span class="service-form-hint">Thêm ảnh từng cái</span>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>1) Ảnh đại diện chính</h4>
              <p class="muted small-text">Ảnh này sẽ hiển thị trên card dịch vụ và trang danh sách.</p>
            </div>

            <div class="service-image-grid">
              <div class="service-image-inputs">
                <input v-model="serviceForm.image" type="text" placeholder="URL ảnh đại diện" />
                <label class="service-file-picker">
                  <span>Chọn ảnh chính từ máy</span>
                  <input type="file" accept="image/*" @change="handleImageFileChange" />
                </label>
                <p v-if="selectedImageName" class="muted small-text">Đã chọn: {{ selectedImageName }}</p>
              </div>

              <div class="service-image-preview" :class="{ empty: !serviceForm.image }">
                <img v-if="serviceForm.image" :src="serviceForm.image" alt="Preview ảnh chính" />
                <div v-else>
                  <strong>Chưa có ảnh</strong>
                  <p>Chọn file hoặc dán URL để xem preview.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="service-form-group-card">
            <div class="service-form-group-card__header">
              <h4>2) Thêm ảnh vào bộ sưu tập</h4>
              <p class="muted small-text">Thêm được tối đa 10 ảnh với cách nhau hoặc chọn file một lần.</p>
            </div>

            <div class="service-gallery-input">
              <input v-model="galleryImageUrl" type="text" placeholder="URL hoặc đường dẫn ảnh bổ sung" />
              <button class="ghost-button" type="button" @click="addGalleryImage(galleryImageUrl)">+ Thêm từ URL</button>
              <label class="service-file-picker">
                <span>Chọn ảnh từ máy</span>
                <input type="file" accept="image/*" @change="addGalleryImageFromFile" />
              </label>
            </div>

            <div v-if="galleryImages.length > 0" class="service-gallery-grid">
              <div v-for="(img, index) in galleryImages" :key="img.id" class="service-gallery-item">
                <div class="service-gallery-preview">
                  <img :src="img.url" :alt="`Ảnh ${index + 1}`" />
                </div>
                <div class="service-gallery-actions">
                  <small class="muted">{{ img.fileName || 'URL' }}</small>
                  <button class="ghost-button small" type="button" @click="removeGalleryImage(img.id)">Xóa</button>
                </div>
              </div>
            </div>
            <p v-else class="muted small-text">Chưa có ảnh bổ sung. Thêm ảnh để hiển thị bộ sưu tập.</p>
          </div>

          <div class="admin-form-actions">
            <button class="secondary-button" type="button" @click="goToStep(2)">Trở về</button>
            <button class="primary-button" type="button" @click="goToStep(4)">Tiếp tục</button>
          </div>
        </section>

        <section v-if="wizardStep === 5" class="service-form-section admin-form-span-2">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">Bước kiểm tra</p>
              <h3>Xác nhận thông tin trước khi thêm dịch vụ</h3>
              <p class="muted small-text">Vui lòng kiểm tra lại toàn bộ thông tin. Khi bấm Đồng ý, hệ thống mới lưu dịch vụ.</p>
            </div>
            <span class="service-form-badge">{{ currentCategoryLabel }}</span>
          </div>

          <div class="service-review-grid">
            <div class="service-review-item">
              <span>Tên dịch vụ</span>
              <strong>{{ serviceForm.name || '-' }}</strong>
            </div>
            <div class="service-review-item">
              <span>Slug</span>
              <strong>{{ serviceForm.slug || '-' }}</strong>
            </div>
            <div class="service-review-item">
              <span>Điểm đến</span>
              <strong>{{ serviceForm.destination || '-' }}</strong>
            </div>
            <div class="service-review-item">
              <span>Tỉnh / thành</span>
              <strong>{{ serviceForm.province || '-' }}</strong>
            </div>
            <div class="service-review-item">
              <span>Giá gốc</span>
              <strong>{{ formatCurrencyVND(serviceForm.price || 0) }}</strong>
            </div>
            <div class="service-review-item">
              <span>Giá khuyến mãi</span>
              <strong>{{ formatCurrencyVND(Math.round((serviceForm.price || 0) * (1 - (serviceForm.discountPercent || 0) / 100))) }}</strong>
            </div>
            <div class="service-review-item">
              <span>Số chỗ còn lại</span>
              <strong>{{ derivedAvailableSlotsText }}</strong>
            </div>
            <div class="service-review-item">
              <span>Loại dịch vụ</span>
              <strong>{{ currentCategoryLabel }}</strong>
            </div>
          </div>

          <div class="service-review-image" :class="{ empty: !serviceForm.image }">
            <img v-if="serviceForm.image" :src="serviceForm.image" alt="Ảnh dịch vụ đã chọn" />
            <p v-else>Chưa có ảnh, hệ thống sẽ dùng ảnh mặc định.</p>
          </div>

          <div class="admin-form-actions">
            <button class="secondary-button" type="button" @click="goToStep(3)">Trở về</button>
            <button class="primary-button" type="button" @click="handleSubmitService">Đồng ý thêm dịch vụ</button>
          </div>
        </section>

        <small v-if="formError" class="error-text admin-form-span-2">{{ formError }}</small>
      </div>

      <div v-if="!isCreatePage" class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Dịch vụ</th>
              <th>Danh mục</th>
              <th>Địa điểm</th>
              <th>Giá bán</th>
              <th>Chỗ còn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in filteredServices" :key="service.id">
              <td>
                <strong>{{ service.name }}</strong>
              </td>
              <td>{{ getCategoryLabel(service.categoryId) }}</td>
              <td>{{ service.destination }}, {{ service.province }}</td>
              <td>{{ formatCurrencyVND(Math.round((service.price || 0) * (1 - (service.discountPercent || 0) / 100))) }}</td>
              <td>
                <span :class="['status-chip', service.availableSlots > 0 ? 'status-chip--blue' : 'status-chip--danger']">
                  {{ service.availableSlots > 0 ? `${service.availableSlots} chỗ` : 'Hết chỗ' }}
                </span>
              </td>
              <td>{{ service.status === 'active' ? 'Còn bán' : 'Ngưng bán' }}</td>
              <td>
                <div class="table-actions">
                  <button class="ghost-button" type="button" @click="startEditService(service)">Sửa</button>
                  <button class="secondary-button" type="button" @click="store.toggleServiceStatus(service.id)">
                    {{ service.status === 'active' ? 'Ẩn' : 'Hiện' }}
                  </button>
                  <button class="secondary-button" type="button" @click="handleDeleteService(service.id)">Xóa</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!isCreatePage && deleteTargetServiceId" class="admin-confirm-overlay" @click.self="cancelDeleteService">
        <div class="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-service-title">
          <p class="eyebrow">Xác nhận thao tác</p>
          <h3 id="delete-service-title">Bạn có chắc muốn xóa dịch vụ này?</h3>
          <p class="muted">Dịch vụ đã xóa sẽ không còn hiển thị trong danh sách quản trị và trang khách.</p>
          <div class="admin-confirm-actions">
            <button class="secondary-button" type="button" @click="cancelDeleteService">Hủy</button>
            <button class="primary-button" type="button" @click="confirmDeleteService">Đồng ý xóa</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin/useAdminStore'
import { useServiceStore } from '@/stores/service/useServiceStore'
import { formatCurrencyVND } from '@/utils/formatters'

const route = useRoute()
const router = useRouter()
const store = useAdminStore()
const serviceStore = useServiceStore()
const categories = computed(() => serviceStore.categories)
const routeCategoryId = computed(() => String(route.meta?.categoryId || route.query.category || '').trim())
const filters = reactive({
  keyword: '',
  categoryId: routeCategoryId.value || 'hotel',
  province: ''
})

const defaultForm = () => ({
  id: null,
  name: '',
  slug: '',
  categoryId: routeCategoryId.value || 'hotel',
  destination: '',
  province: '',
  price: 0,
  discountPercent: 0,
  rating: 4.5,
  availableSlots: 0,
  status: 'active',
  image: '',
  gallery: [],
  detailedDescription: '',
  highlightedFeatures: '',
  scheduleInfo: '',
  description: '',
  amenities: [],
  createdAt: new Date().toISOString(),
  featured: false,
  itinerary: [],
  departures: []
})

const serviceForm = reactive(defaultForm())
const isEditing = ref(false)
const formError = ref('')
const selectedImageName = ref('')
const galleryImages = ref([])
const galleryImageUrl = ref('')
const wizardStep = ref(1)
const deleteTargetServiceId = ref('')
const isCreatePage = computed(() => route.name === 'admin-services-create')

const createRoomType = (overrides = {}) => ({
  value: 'standard',
  label: 'Phòng tiêu chuẩn',
  priceMultiplier: 1,
  childSurcharge: 320000,
  availableSlots: 10,
  ...overrides
})

const createTourDeparture = (overrides = {}) => ({
  departureId: '',
  startDate: '',
  endDate: '',
  durationPreset: '3n2d',
  durationDays: 3,
  durationNights: 2,
  remainingSlots: 10,
  priceOverride: 0,
  ...overrides
})

const createTourChildPolicy = (overrides = {}) => ({
  freeUnderAge: 5,
  childRate: 0.75,
  adultAgeThreshold: 10,
  ...overrides
})

const createPricingTier = (label, overrides = {}) => ({
  label,
  adultPrice: 0,
  childPrice: 0,
  note: '',
  ...overrides
})

const createTicketChildPolicy = (overrides = {}) => ({
  freeUnderAge: 8,
  adultAgeThreshold: 15,
  surchargeAgeMin: 8,
  surchargeAgeMax: 14,
  surcharge: 180000,
  ...overrides
})

const createTicketPackage = (overrides = {}) => ({
  id: 'entry',
  name: 'Gói vào cổng',
  salePrice: 0,
  price: 0,
  childSurcharge: 0,
  availableSlots: 10,
  featuresText: 'Vé vào cổng',
  ...overrides
})

const roomTypes = ref([createRoomType()])
const tourScheduleType = ref('hybrid')
const tourFlexibleStart = ref('')
const tourFlexibleEnd = ref('')
const tourChildPolicy = ref(createTourChildPolicy())
const tourPricingTiers = ref({
  fixed: createPricingTier('Lịch cố định (ưu đãi)'),
  flexible: createPricingTier('Lịch linh hoạt')
})
const tourDepartures = ref([createTourDeparture()])
const ticketServiceType = ref('Công viên giải trí')
const ticketChildPolicy = ref(createTicketChildPolicy())
const ticketPackages = ref([
  createTicketPackage({ id: 'entry', name: 'Gói vào cổng', featuresText: 'Vé vào cổng' }),
  createTicketPackage({ id: 'fun', name: 'Gói vui chơi', featuresText: 'Vé vào cổng, Bao gồm khu trò chơi chính' })
])

const tourDurationOptions = [
  { value: '2n1d', label: '2 ngày 1 đêm' },
  { value: '3n2d', label: '3 ngày 2 đêm' },
  { value: '4n3d', label: '4 ngày 3 đêm' },
  { value: '5n4d', label: '5 ngày 4 đêm' },
  { value: 'custom', label: 'Tùy chỉnh' }
]

const TOUR_DURATION_PRESET_MAP = Object.freeze({
  '2n1d': { durationDays: 2, durationNights: 1 },
  '3n2d': { durationDays: 3, durationNights: 2 },
  '4n3d': { durationDays: 4, durationNights: 3 },
  '5n4d': { durationDays: 5, durationNights: 4 }
})

const stepItems = [
  { step: 1, title: 'Chọn loại dịch vụ', description: 'Khách sạn, tour hoặc vé tham quan.' },
  { step: 2, title: 'Nhập thông tin', description: 'Thông tin chung, mô tả và tiện ích .' },
  { step: 3, title: 'Thêm ảnh', description: 'Nhiều ảnh để hiển thị dịch vụ.' },
  { step: 4, title: 'Thiết lập', description: 'Cấu hình chi tiết theo loại dịch vụ.' },
  { step: 5, title: 'Kiểm tra', description: 'Xác nhận toàn bộ thông tin trước khi lưu.' }
]

const categoryTabs = computed(() => {
  const availableCategories = categories.value.filter((category) => ['hotel', 'tour', 'ticket'].includes(String(category.id)))
  if (!routeCategoryId.value) return availableCategories
  return availableCategories.filter((category) => String(category.id) === routeCategoryId.value)
})
const currentCategoryLabel = computed(() => getCategoryLabel(serviceForm.categoryId) || 'Chưa chọn loại')

const provinceOptions = computed(() =>
  [...new Set(serviceStore.services.map((service) => service.province))].sort((left, right) => left.localeCompare(right, 'vi'))
)

const filteredServices = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  return serviceStore.services.filter((service) => {
    const matchesKeyword = !keyword || [service.name, service.destination, service.province]
      .join(' ')
      .toLowerCase()
      .includes(keyword)

    const matchesCategory = !filters.categoryId || service.categoryId === filters.categoryId
    const matchesProvince = !filters.province || service.province === filters.province
    return matchesKeyword && matchesCategory && matchesProvince
  })
})

const ticketPolicySummary = computed(() => {
  const freeUnderAge = Math.max(0, Number(ticketChildPolicy.value.freeUnderAge || 0) || 0)
  const surchargeAgeMin = Math.max(0, Number(ticketChildPolicy.value.surchargeAgeMin || 0) || 0)
  const surchargeAgeMax = Math.max(0, Number(ticketChildPolicy.value.surchargeAgeMax || 0) || 0)
  const adultAgeThreshold = Math.max(0, Number(ticketChildPolicy.value.adultAgeThreshold || 0) || 0)
  const surcharge = Math.max(0, Number(ticketChildPolicy.value.surcharge || 0) || 0)

  return `Tóm tắt: miễn phí dưới ${freeUnderAge} tuổi, phụ thu từ ${surchargeAgeMin}-${surchargeAgeMax} tuổi (${formatCurrencyVND(surcharge)}), từ ${adultAgeThreshold} tuổi tính vé người lớn.`
})

const totalHotelSlots = computed(() =>
  roomTypes.value.reduce((sum, roomType) => sum + Math.max(0, Number(roomType?.availableSlots || 0) || 0), 0)
)

const totalTicketSlots = computed(() =>
  ticketPackages.value.reduce((sum, ticketPackage) => sum + Math.max(0, Number(ticketPackage?.availableSlots || 0) || 0), 0)
)

const totalFixedTourSlots = computed(() =>
  tourDepartures.value.reduce((sum, departure) => sum + Math.max(0, Number(departure?.remainingSlots || 0) || 0), 0)
)

const derivedAvailableSlots = computed(() => {
  if (serviceForm.categoryId === 'hotel') return totalHotelSlots.value
  if (serviceForm.categoryId === 'ticket') return totalTicketSlots.value
  if (serviceForm.categoryId === 'tour') {
    return tourScheduleType.value === 'fixed' ? totalFixedTourSlots.value : Number.MAX_SAFE_INTEGER
  }
  return Math.max(0, Number(serviceForm.availableSlots || 0) || 0)
})

const derivedAvailableSlotsText = computed(() => {
  if (serviceForm.categoryId === 'tour' && tourScheduleType.value !== 'fixed') {
    return 'Linh hoạt theo ngày đi (không giới hạn theo tổng chỗ)'
  }
  return String(derivedAvailableSlots.value)
})

const getCategoryLabel = (categoryId) =>
  categories.value.find((category) => category.id === categoryId)?.name || 'Dịch vụ'

const getCategoryHint = (categoryId) => ({
  hotel: 'Lưu trú',
  tour: 'Hành trình',
  ticket: 'Vé / trải nghiệm'
}[categoryId] || 'Dịch vụ')

const validateCommonFields = () => {
  if (!serviceForm.name || !serviceForm.slug || !serviceForm.categoryId || !serviceForm.destination || !serviceForm.province) {
    formError.value = 'Vui lòng nhập đầy đủ tên dịch vụ, slug, danh mục, điểm đến và tỉnh/thành.'
    return false
  }

  if (Number(serviceForm.price) < 0 || Number(serviceForm.discountPercent) < 0 || Number(serviceForm.discountPercent) > 100) {
    formError.value = 'Giá không được nhỏ hơn 0. Phần trăm giảm giá phải từ 0 đến 100.'
    return false
  }

  return true
}

const validateModelByCategory = () => {
  if (serviceForm.categoryId === 'hotel' && roomTypes.value.length === 0) {
    formError.value = 'Khách sạn cần ít nhất 1 loại phòng.'
    return false
  }

  if (serviceForm.categoryId === 'tour') {
    const scheduleType = String(tourScheduleType.value || 'hybrid')
    const departuresWithDate = tourDepartures.value.filter((departure) => departure.startDate && departure.endDate)

    // Lịch cố định bắt buộc phải có ít nhất 1 lịch đủ ngày đi/ngày về.
    if (scheduleType === 'fixed' && departuresWithDate.length === 0) {
      formError.value = 'Tour lịch cố định cần ít nhất 1 lịch khởi hành có ngày đi và ngày về.'
      return false
    }

    // Lịch kết hợp: cần ít nhất 1 lịch cố định hoặc khoảng ngày linh hoạt.
    if (scheduleType === 'hybrid') {
      const hasFlexibleWindow = Boolean(tourFlexibleStart.value && tourFlexibleEnd.value)
      if (departuresWithDate.length === 0 && !hasFlexibleWindow) {
        formError.value = 'Tour kết hợp cần ít nhất 1 lịch khởi hành hoặc khoảng ngày linh hoạt.'
        return false
      }
    }
  }

  if (serviceForm.categoryId === 'ticket' && ticketPackages.value.length === 0) {
    formError.value = 'Vé tham quan cần ít nhất 1 gói vé.'
    return false
  }

  return true
}

const validateDescriptionFields = () => {
  if (!serviceForm.detailedDescription?.trim()) {
    formError.value = 'Mô tả chi tiết không được để trống.'
    return false
  }

  if (!serviceForm.highlightedFeatures?.trim()) {
    formError.value = 'Tiện ích nổi bật không được để trống.'
    return false
  }

  if (!serviceForm.scheduleInfo?.trim()) {
    formError.value = 'Lịch trình (hoặc thông tin hành trình) không được để trống.'
    return false
  }

  return true
}

const goToStep = (step) => {
  formError.value = ''
  wizardStep.value = Math.min(5, Math.max(1, Number(step) || 1))
}

const goToStepThree = () => {
  formError.value = ''
  if (!validateCommonFields()) return
  if (!validateDescriptionFields()) return
  goToStep(3)
}

const goToReviewStep = () => {
  formError.value = ''
  if (!validateModelByCategory()) return
  goToStep(5)
}

const addRoomType = () => roomTypes.value.push(createRoomType({ value: `room-type-${roomTypes.value.length + 1}` }))
const removeRoomType = (index) => {
  if (roomTypes.value.length === 1) return
  roomTypes.value.splice(index, 1)
}

const resolveDepartureDurationPreset = (durationDays, durationNights) => {
  const days = Math.max(1, Number(durationDays || 1) || 1)
  const nights = Math.max(0, Number(durationNights || 0) || 0)

  const matched = Object.entries(TOUR_DURATION_PRESET_MAP).find(([, value]) =>
    value.durationDays === days && value.durationNights === nights
  )

  return matched?.[0] || 'custom'
}

const syncTourDepartureEndDate = (departure) => {
  if (!departure?.startDate) {
    departure.endDate = ''
    return
  }

  const startDate = new Date(`${departure.startDate}T00:00:00`)
  if (Number.isNaN(startDate.getTime())) {
    departure.endDate = ''
    return
  }

  const durationDays = Math.max(1, Number(departure.durationDays || 1) || 1)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + durationDays - 1)
  departure.endDate = endDate.toISOString().slice(0, 10)
}

const handleDeparturePresetChange = (departure) => {
  const preset = String(departure?.durationPreset || 'custom')
  const mapped = TOUR_DURATION_PRESET_MAP[preset]

  if (mapped) {
    departure.durationDays = mapped.durationDays
    departure.durationNights = mapped.durationNights
  }

  syncTourDepartureEndDate(departure)
}

const handleDepartureStartDateChange = (departure) => {
  syncTourDepartureEndDate(departure)
}

const addTourDeparture = () => {
  const nextDeparture = createTourDeparture({ departureId: `DEP-${tourDepartures.value.length + 1}` })
  handleDeparturePresetChange(nextDeparture)
  tourDepartures.value.push(nextDeparture)
}
const removeTourDeparture = (index) => {
  if (tourDepartures.value.length === 1) return
  tourDepartures.value.splice(index, 1)
}

const addTicketPackage = () => ticketPackages.value.push(createTicketPackage({ id: `pkg-${ticketPackages.value.length + 1}` }))
const removeTicketPackage = (index) => {
  if (ticketPackages.value.length === 1) return
  ticketPackages.value.splice(index, 1)
}

const syncTicketAgePolicy = () => {
  const normalizedFreeUnderAge = Math.max(0, Number(ticketChildPolicy.value.freeUnderAge || 0) || 0)
  const normalizedSurchargeMin = Math.max(normalizedFreeUnderAge, Number(ticketChildPolicy.value.surchargeAgeMin || 0) || 0)
  const normalizedAdultAgeThreshold = Math.max(normalizedSurchargeMin + 1, Number(ticketChildPolicy.value.adultAgeThreshold || 0) || 0)
  const normalizedSurchargeMax = Math.max(normalizedSurchargeMin, normalizedAdultAgeThreshold - 1)

  ticketChildPolicy.value.freeUnderAge = normalizedFreeUnderAge
  ticketChildPolicy.value.surchargeAgeMin = normalizedSurchargeMin
  ticketChildPolicy.value.adultAgeThreshold = normalizedAdultAgeThreshold
  ticketChildPolicy.value.surchargeAgeMax = normalizedSurchargeMax
}

watch(
  () => [
    ticketChildPolicy.value.freeUnderAge,
    ticketChildPolicy.value.surchargeAgeMin,
    ticketChildPolicy.value.adultAgeThreshold
  ],
  () => {
    syncTicketAgePolicy()
  },
  { immediate: true }
)

const syncModelFieldsForCategory = (categoryId, sourceService = null) => {
  const normalizedCategoryId = String(categoryId || 'hotel')

  if (normalizedCategoryId === 'hotel') {
    const sourceRoomTypes = Array.isArray(sourceService?.roomTypes) && sourceService.roomTypes.length > 0
      ? sourceService.roomTypes
      : [
          { value: 'standard', label: 'Phòng tiêu chuẩn', priceMultiplier: 1, childSurcharge: 320000 },
          { value: 'deluxe', label: 'Phòng deluxe', priceMultiplier: 1.15, childSurcharge: 380000 },
          { value: 'family', label: 'Phòng gia đình', priceMultiplier: 1.3, childSurcharge: 460000 }
        ]
    roomTypes.value = sourceRoomTypes.map((roomType, index) => createRoomType({
      value: String(roomType.value || roomType.id || `room-type-${index + 1}`),
      label: String(roomType.label || roomType.name || `Loại phòng ${index + 1}`),
      priceMultiplier: Number(roomType.priceMultiplier || 1) || 1,
      childSurcharge: Number(roomType.childSurcharge || 320000) || 320000,
      availableSlots: Math.max(0, Number(roomType.availableSlots || 0) || 0)
    }))
  }

  if (normalizedCategoryId === 'tour') {
    tourScheduleType.value = sourceService?.scheduleType || 'hybrid'
    tourFlexibleStart.value = sourceService?.flexibleWindow?.startDate || ''
    tourFlexibleEnd.value = sourceService?.flexibleWindow?.endDate || ''
    tourChildPolicy.value = createTourChildPolicy({ ...(sourceService?.tourChildPolicy || {}) })
    tourPricingTiers.value = {
      fixed: createPricingTier('Lịch cố định (ưu đãi)', {
        ...(sourceService?.pricingTiers?.fixed || {})
      }),
      flexible: createPricingTier('Lịch linh hoạt', {
        ...(sourceService?.pricingTiers?.flexible || {})
      })
    }
    tourDepartures.value = (Array.isArray(sourceService?.departures) && sourceService.departures.length > 0
      ? sourceService.departures
      : [createTourDeparture()]
    ).map((departure, index) => createTourDeparture({
      departureId: String(departure.departureId || `DEP-${index + 1}`),
      startDate: String(departure.startDate || ''),
      endDate: String(departure.endDate || departure.startDate || ''),
      durationPreset: resolveDepartureDurationPreset(departure.durationDays, departure.durationNights),
      durationDays: Number(departure.durationDays || 3) || 3,
      durationNights: Number(departure.durationNights || 2) || 2,
      remainingSlots: Number(departure.remainingSlots || 10) || 10,
      priceOverride: Number(departure.priceOverride || 0) || 0
    }))
  }

  if (normalizedCategoryId === 'ticket') {
    ticketServiceType.value = sourceService?.ticketServiceType || 'Công viên giải trí'
    ticketChildPolicy.value = createTicketChildPolicy({ ...(sourceService?.ticketChildPolicy || {}) })
    syncTicketAgePolicy()
    ticketPackages.value = (Array.isArray(sourceService?.ticketPackages) && sourceService.ticketPackages.length > 0
      ? sourceService.ticketPackages
      : [
          { id: 'entry', name: 'Gói vào cổng', salePrice: 0, price: 0, childSurcharge: 0, features: ['Vé vào cổng'] },
          { id: 'fun', name: 'Gói vui chơi', salePrice: 0, price: 0, childSurcharge: 0, features: ['Vé vào cổng', 'Bao gồm khu trò chơi chính'] }
        ]
    ).map((ticketPackage, index) => createTicketPackage({
      id: String(ticketPackage.id || `pkg-${index + 1}`),
      name: String(ticketPackage.name || `Gói ${index + 1}`),
      salePrice: Number(ticketPackage.salePrice || 0) || 0,
      price: Number(ticketPackage.price || 0) || 0,
      childSurcharge: Number(ticketPackage.childSurcharge || 0) || 0,
      availableSlots: Math.max(0, Number(ticketPackage.availableSlots || 0) || 0),
      featuresText: Array.isArray(ticketPackage.features) ? ticketPackage.features.join(', ') : String(ticketPackage.featuresText || '')
    }))
  }
}

const addGalleryImage = (imageUrl) => {
  if (imageUrl?.trim() && galleryImages.value.length < 10) {
    galleryImages.value.push({ id: `img-${Date.now()}-${Math.random()}`, url: imageUrl })
    galleryImageUrl.value = ''
  }
}

const addGalleryImageFromFile = async (event) => {
  const [file] = event.target.files || []
  if (!file || galleryImages.value.length >= 10) return

  try {
    const dataUrl = await readFileAsDataUrl(file)
    galleryImages.value.push({ id: `img-${Date.now()}-${Math.random()}`, url: dataUrl, fileName: file.name })
  } catch (error) {
    formError.value = error.message
  }
}

const removeGalleryImage = (imageId) => {
  const index = galleryImages.value.findIndex((img) => img.id === imageId)
  if (index > -1) {
    galleryImages.value.splice(index, 1)
  }
}

const resetServiceForm = () => {
  Object.assign(serviceForm, defaultForm())
  formError.value = ''
  selectedImageName.value = ''
  galleryImages.value = []
  syncModelFieldsForCategory(serviceForm.categoryId)
  isEditing.value = false
  wizardStep.value = 1
}

const startCreateService = () => {
  resetServiceForm()
  syncModelFieldsForCategory(serviceForm.categoryId)
  if (!isCreatePage.value) {
    router.push({ name: 'admin-services-create', query: routeCategoryId.value ? { category: routeCategoryId.value } : {} })
  }
}

const goToServicesList = () => {
  router.push({ name: 'admin-services', query: routeCategoryId.value ? { category: routeCategoryId.value } : {} })
}

const startEditService = (service) => {
  Object.assign(serviceForm, {
    ...service,
    gallery: [...(service.gallery || [])],
    amenities: [...(service.amenities || [])],
    itinerary: [...(service.itinerary || [])],
    departures: [...(service.departures || [])]
  })
  formError.value = ''
  selectedImageName.value = ''
  syncModelFieldsForCategory(service.categoryId, service)
  isEditing.value = true
  wizardStep.value = 2
}

const selectServiceCategory = (categoryId) => {
  serviceForm.categoryId = String(categoryId || 'hotel')
  syncModelFieldsForCategory(serviceForm.categoryId)
  formError.value = ''
  wizardStep.value = 2
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh đã chọn.'))
    reader.readAsDataURL(file)
  })

const handleImageFileChange = async (event) => {
  const [file] = event.target.files || []
  if (!file) return

  try {
    const dataUrl = await readFileAsDataUrl(file)
    serviceForm.image = dataUrl
    serviceForm.imageAssetPath = `/src/assets/image/${file.name}`
    selectedImageName.value = file.name
  } catch (error) {
    formError.value = error.message
  }
}

const normalizeRoomTypesForSave = () => roomTypes.value.map((roomType, index) => ({
  value: String(roomType.value || `room-type-${index + 1}`).trim() || `room-type-${index + 1}`,
  label: String(roomType.label || `Loại phòng ${index + 1}`).trim() || `Loại phòng ${index + 1}`,
  priceMultiplier: Math.max(0.8, Number(roomType.priceMultiplier || 1) || 1),
  childSurcharge: Math.max(0, Number(roomType.childSurcharge || 0) || 0),
  availableSlots: Math.max(0, Number(roomType.availableSlots || 0) || 0)
}))

const normalizeTourDeparturesForSave = () => tourDepartures.value
  .map((departure, index) => ({
    departureId: String(departure.departureId || `DEP-${index + 1}`).trim() || `DEP-${index + 1}`,
    startDate: String(departure.startDate || '').trim(),
    endDate: String(departure.endDate || departure.startDate || '').trim(),
    durationDays: Math.max(1, Number(departure.durationDays || 1) || 1),
    durationNights: Math.max(0, Number(departure.durationNights || 0) || 0),
    remainingSlots: Math.max(0, Number(departure.remainingSlots || 0) || 0),
    priceOverride: Math.max(0, Number(departure.priceOverride || 0) || 0)
  }))
  .filter((departure) => departure.startDate && departure.endDate)

const normalizeTicketPackagesForSave = () => ticketPackages.value.map((ticketPackage, index) => ({
  id: String(ticketPackage.id || `pkg-${index + 1}`).trim() || `pkg-${index + 1}`,
  name: String(ticketPackage.name || `Gói ${index + 1}`).trim() || `Gói ${index + 1}`,
  salePrice: Math.max(0, Number(ticketPackage.salePrice || 0) || 0),
  price: Math.max(0, Number(ticketPackage.price || 0) || 0),
  childSurcharge: Math.max(0, Number(ticketPackage.childSurcharge || 0) || 0),
  availableSlots: Math.max(0, Number(ticketPackage.availableSlots || 0) || 0),
  features: String(ticketPackage.featuresText || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}))

const normalizeTourPricingTiersForSave = () => ({
  fixed: {
    label: String(tourPricingTiers.value.fixed.label || 'Lịch cố định (ưu đãi)').trim(),
    adultPrice: Math.max(0, Number(tourPricingTiers.value.fixed.adultPrice || 0) || 0),
    childPrice: Math.max(0, Number(tourPricingTiers.value.fixed.childPrice || 0) || 0),
    note: String(tourPricingTiers.value.fixed.note || '').trim()
  },
  flexible: {
    label: String(tourPricingTiers.value.flexible.label || 'Lịch linh hoạt').trim(),
    adultPrice: Math.max(0, Number(tourPricingTiers.value.flexible.adultPrice || 0) || 0),
    childPrice: Math.max(0, Number(tourPricingTiers.value.flexible.childPrice || 0) || 0),
    note: String(tourPricingTiers.value.flexible.note || '').trim()
  }
})

const normalizeTourChildPolicyForSave = () => ({
  freeUnderAge: Math.max(0, Number(tourChildPolicy.value.freeUnderAge || 0) || 0),
  childRate: Math.max(0, Math.min(1, Number(tourChildPolicy.value.childRate || 0.75) || 0.75)),
  adultAgeThreshold: Math.max(0, Number(tourChildPolicy.value.adultAgeThreshold || 10) || 10)
})

const normalizeTicketChildPolicyForSave = () => ({
  freeUnderAge: Math.max(0, Number(ticketChildPolicy.value.freeUnderAge || 0) || 0),
  adultAgeThreshold: Math.max(0, Number(ticketChildPolicy.value.adultAgeThreshold || 0) || 0),
  surchargeAgeMin: Math.max(0, Number(ticketChildPolicy.value.surchargeAgeMin || 0) || 0),
  surchargeAgeMax: Math.max(0, Number(ticketChildPolicy.value.surchargeAgeMax || 0) || 0),
  surcharge: Math.max(0, Number(ticketChildPolicy.value.surcharge || 0) || 0)
})

const isDataUrl = (value = '') => /^data:/i.test(String(value || '').trim())

const sanitizeImageForSave = (value = '') => {
  const normalized = String(value || '').trim()
  if (!normalized) return ''
  if (isDataUrl(normalized)) return ''
  return normalized
}

const normalizeGalleryForSave = () => {
  const stepGalleryUrls = galleryImages.value.map((item) => item?.url).filter(Boolean)
  const mergedGallery = [...(serviceForm.gallery || []), ...stepGalleryUrls]
  const cleanedGallery = mergedGallery
    .map((url) => sanitizeImageForSave(url))
    .filter(Boolean)

  return [...new Set(cleanedGallery)].slice(0, 10)
}

const handleSubmitService = async () => {
  formError.value = ''
  if (wizardStep.value !== 5) return
  if (!validateCommonFields()) return
  if (!validateDescriptionFields()) return
  if (!validateModelByCategory()) return

  const fallbackImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80'
  const resolvedImage = sanitizeImageForSave(serviceForm.image)
    || sanitizeImageForSave(serviceForm.imageAssetPath)
    || fallbackImage
  const normalizedGallery = normalizeGalleryForSave()
  const resolvedGallery = normalizedGallery.length ? normalizedGallery : [resolvedImage]

  const basePayload = {
    ...serviceForm,
    availableSlots: Number.isFinite(derivedAvailableSlots.value)
      ? Math.max(0, Number(derivedAvailableSlots.value) || 0)
      : 0,
    image: resolvedImage,
    gallery: resolvedGallery,
    amenities: serviceForm.amenities.length ? serviceForm.amenities : ['Hỗ trợ khách Việt', 'Xác nhận nhanh'],
    itinerary: serviceForm.itinerary.length ? serviceForm.itinerary : ['Lịch trình đang cập nhật'],
    description: serviceForm.description || serviceForm.detailedDescription
  }

  try {
    if (serviceForm.categoryId === 'hotel') {
      await store.saveService({
        ...basePayload,
        roomTypes: normalizeRoomTypesForSave()
      })
      resetServiceForm()
      if (isCreatePage.value) goToServicesList()
      return
    }

    if (serviceForm.categoryId === 'tour') {
      await store.saveService({
        ...basePayload,
        scheduleType: tourScheduleType.value,
        flexibleWindow: {
          startDate: tourFlexibleStart.value,
          endDate: tourFlexibleEnd.value
        },
        tourChildPolicy: normalizeTourChildPolicyForSave(),
        pricingTiers: normalizeTourPricingTiersForSave(),
        departures: normalizeTourDeparturesForSave()
      })
      resetServiceForm()
      if (isCreatePage.value) goToServicesList()
      return
    }

    if (serviceForm.categoryId === 'ticket') {
      const normalizedTicketChildPolicy = normalizeTicketChildPolicyForSave()
      await store.saveService({
        ...basePayload,
        ticketServiceType: ticketServiceType.value || 'Vé tham quan',
        ticketChildPolicy: normalizedTicketChildPolicy,
        ticketPackages: normalizeTicketPackagesForSave(),
        childSurcharge: Number(normalizedTicketChildPolicy.surcharge || 0)
      })
      resetServiceForm()
      if (isCreatePage.value) goToServicesList()
      return
    }

    await store.saveService(basePayload)
    resetServiceForm()
    if (isCreatePage.value) goToServicesList()
  } catch (error) {
    formError.value = error?.message || 'Không thể lưu dịch vụ vào cơ sở dữ liệu.'
  }
}

const handleDeleteService = (serviceId) => {
  deleteTargetServiceId.value = String(serviceId)
}

const cancelDeleteService = () => {
  deleteTargetServiceId.value = ''
}

const confirmDeleteService = () => {
  if (!deleteTargetServiceId.value) return
  store.deleteService(deleteTargetServiceId.value)
  deleteTargetServiceId.value = ''
}
</script>

<style scoped>
.service-form-tip {
  display: grid;
  gap: 6px;
  margin: 12px 0 16px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 79, 193, 0.14);
  background: rgba(15, 79, 193, 0.06);
}

.service-form-tip strong {
  color: var(--text-primary);
  font-size: 0.92rem;
}

.service-form-tip span {
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

.service-form-group-card {
  margin-bottom: 14px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
}

.service-form-group-card__header {
  margin-bottom: 10px;
}

.service-form-group-card__header h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.service-form-group-card__header p {
  margin: 4px 0 0;
}

.tour-pricing-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.tour-pricing-card {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 10px;
  padding: 12px;
  background: rgba(248, 250, 252, 0.7);
}

.tour-pricing-card h5 {
  margin: 0 0 8px;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.ticket-package-card {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.7);
}

.service-gallery-input {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
  margin-bottom: 16px;
}

.service-gallery-input input {
  flex: 1;
  min-width: 200px;
}

.service-gallery-input button {
  white-space: nowrap;
}

.service-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin: 12px 0;
}

.service-gallery-item {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.service-gallery-preview {
  width: 100%;
  height: 100px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-gallery-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-gallery-actions {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.service-gallery-actions small {
  font-size: 0.75rem;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.service-gallery-actions button {
  font-size: 0.85rem;
  padding: 4px 8px;
}

.service-form-inline-note {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

@media (max-width: 768px) {
  .service-form-group-card {
    padding: 12px;
  }

  .tour-pricing-grid {
    grid-template-columns: 1fr;
  }

  .service-gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>