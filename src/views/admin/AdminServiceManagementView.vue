<template>
  <section class="admin-page">
    <div class="panel-card">
      <div class="section-heading compact admin-heading-stack">
        <div>
          <p class="eyebrow">Quản lý dịch vụ</p>
          <h2>Dịch vụ du lịch nội địa Việt Nam</h2>
          <p class="muted small-text">Chọn loại dịch vụ trước, sau đó điền thông tin và ảnh đại diện theo từng khối để dễ kiểm tra.</p>
        </div>
        <button class="primary-button" type="button" @click="startCreateService">+ Thêm dịch vụ</button>
      </div>

      <div class="admin-toolbar">
        <input v-model="filters.keyword" type="text" placeholder="Tìm theo tên dịch vụ hoặc điểm đến" />
        <select v-model="filters.categoryId">
          <option value="">Tất cả danh mục</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        <select v-model="filters.province">
          <option value="">Tất cả tỉnh/thành</option>
          <option v-for="province in provinceOptions" :key="province" :value="province">
            {{ province }}
          </option>
        </select>
      </div>

      <div class="service-form-steps">
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

      <div v-if="wizardStep === 1" class="service-form-legend">
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

      <div class="admin-form-grid">
        <section v-if="wizardStep === 2" class="service-form-section admin-form-span-2">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">Thông tin cơ bản</p>
              <h3>Tên, slug, điểm đến và giá</h3>
              <p class="muted small-text">Mỗi ô có nhãn rõ ràng để tránh nhầm giữa tên hiển thị, đường dẫn và giá bán.</p>
            </div>
            <span class="service-form-badge">{{ currentCategoryLabel }}</span>
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
            <div class="field-group">
              <label>Danh mục</label>
              <select v-model="serviceForm.categoryId" @change="handleCategoryChange">
                <option value="">Chọn danh mục</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            <div class="field-group">
              <label>Điểm đến</label>
              <input v-model="serviceForm.destination" type="text" placeholder="Ví dụ: Hạ Long" />
            </div>
            <div class="field-group">
              <label>Giá gốc</label>
              <input v-model.number="serviceForm.price" type="number" min="0" placeholder="0" />
            </div>
            <div class="field-group">
              <label>Giá khuyến mãi</label>
              <input v-model.number="serviceForm.salePrice" type="number" min="0" placeholder="0" />
            </div>
            <div class="field-group">
              <label>Số chỗ còn lại</label>
              <input v-model.number="serviceForm.availableSlots" type="number" min="0" placeholder="10" />
            </div>
            <div class="field-group">
              <label>Tỉnh / thành</label>
              <input v-model="serviceForm.province" type="text" placeholder="Ví dụ: Quảng Ninh" />
            </div>
          </div>

          <div class="admin-form-actions">
            <button class="secondary-button" type="button" @click="goToStep(1)">Trở về</button>
            <button class="primary-button" type="button" @click="goToStepThree">Tiếp tục</button>
          </div>
        </section>

        <section v-if="wizardStep === 2 && serviceForm.categoryId === 'hotel'" class="service-form-section admin-form-span-2">
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
              </div>
            </div>
          </div>

          <button class="ghost-button" type="button" @click="addRoomType">+ Thêm loại phòng</button>
        </section>

        <section v-else-if="wizardStep === 2 && serviceForm.categoryId === 'tour'" class="service-form-section admin-form-span-2">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">Thiết lập tour</p>
              <h3>Lịch, chính sách trẻ em và bảng giá</h3>
              <p class="muted small-text">Tour cần lịch khởi hành, kiểu lịch và bảng giá để trang chi tiết hoạt động đúng.</p>
            </div>
            <span class="service-form-hint">Cấu hình tour</span>
          </div>

          <div class="admin-form-grid service-form-grid">
            <div class="field-group">
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
            <div class="field-group">
              <label>Miễn phí cho trẻ dưới</label>
              <input v-model.number="tourChildPolicy.freeUnderAge" type="number" min="0" />
            </div>
            <div class="field-group">
              <label>Tỷ lệ giá trẻ em</label>
              <input v-model.number="tourChildPolicy.childRate" type="number" min="0" max="1" step="0.05" />
            </div>
            <div class="field-group">
              <label>Tuổi tính như người lớn</label>
              <input v-model.number="tourChildPolicy.adultAgeThreshold" type="number" min="0" />
            </div>
            <div class="field-group admin-form-span-2">
              <label>Bảng giá lịch cố định</label>
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
            <div class="field-group admin-form-span-2">
              <label>Bảng giá lịch linh hoạt</label>
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
            <div class="field-group admin-form-span-2">
              <label>Lịch khởi hành</label>
              <div class="service-model-list">
                <div v-for="(departure, index) in tourDepartures" :key="`${departure.departureId}-${index}`" class="service-model-item">
                  <div class="service-model-item__header">
                    <strong>Lịch {{ index + 1 }}</strong>
                    <button class="ghost-button" type="button" :disabled="tourDepartures.length === 1" @click="removeTourDeparture(index)">Xóa</button>
                  </div>

                  <div class="admin-form-grid service-form-grid">
                    <div class="field-group">
                      <label>Mã lịch</label>
                      <input v-model="departure.departureId" type="text" placeholder="T001-2026-07-20" />
                    </div>
                    <div class="field-group">
                      <label>Ngày đi</label>
                      <input v-model="departure.startDate" type="date" />
                    </div>
                    <div class="field-group">
                      <label>Ngày về</label>
                      <input v-model="departure.endDate" type="date" />
                    </div>
                    <div class="field-group">
                      <label>Số ngày</label>
                      <input v-model.number="departure.durationDays" type="number" min="1" />
                    </div>
                    <div class="field-group">
                      <label>Số đêm</label>
                      <input v-model.number="departure.durationNights" type="number" min="0" />
                    </div>
                    <div class="field-group">
                      <label>Còn chỗ</label>
                      <input v-model.number="departure.remainingSlots" type="number" min="0" />
                    </div>
                  </div>
                </div>
              </div>
              <button class="ghost-button" type="button" @click="addTourDeparture">+ Thêm lịch khởi hành</button>
            </div>
          </div>
        </section>

        <section v-else-if="wizardStep === 2 && serviceForm.categoryId === 'ticket'" class="service-form-section admin-form-span-2">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">Thiết lập vé tham quan</p>
              <h3>Loại vé, chính sách trẻ em và gói vé</h3>
              <p class="muted small-text">Vé tham quan cần loại vé, chính sách trẻ em và các gói vé để hiển thị đúng bảng giá.</p>
            </div>
            <span class="service-form-hint">Cấu hình vé</span>
          </div>

          <div class="admin-form-grid service-form-grid">
            <div class="field-group">
              <label>Loại dịch vụ vé</label>
              <input v-model="ticketServiceType" type="text" placeholder="Ví dụ: Công viên giải trí" />
            </div>
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
            <div class="field-group">
              <label>Tuổi kết thúc phụ thu</label>
              <input v-model.number="ticketChildPolicy.surchargeAgeMax" type="number" min="0" />
            </div>
            <div class="field-group admin-form-span-2">
              <label>Mức phụ thu trẻ em</label>
              <input v-model.number="ticketChildPolicy.surcharge" type="number" min="0" />
            </div>
            <div class="field-group admin-form-span-2">
              <label>Gói vé</label>
              <div class="service-model-list">
                <div v-for="(ticketPackage, index) in ticketPackages" :key="`${ticketPackage.id}-${index}`" class="service-model-item">
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
                      <label>Tiện ích của gói, ngăn cách bằng dấu phẩy</label>
                      <input v-model="ticketPackage.featuresText" type="text" placeholder="Vé vào cổng, Không gồm khu trò chơi mở rộng" />
                    </div>
                  </div>
                </div>
              </div>
              <button class="ghost-button" type="button" @click="addTicketPackage">+ Thêm gói vé</button>
            </div>
          </div>
        </section>

        <section v-if="wizardStep === 3" class="service-form-section admin-form-span-2">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">Ảnh đại diện</p>
              <h3>Chọn URL hoặc tải ảnh từ máy</h3>
              <p class="muted small-text">Có thể dán link ảnh hoặc chọn file để xem preview ngay. Dữ liệu file chỉ dùng mock trước, không phá cấu trúc hiện tại.</p>
            </div>
            <span class="service-form-hint">Tải ảnh mô phỏng</span>
          </div>

          <div class="service-image-grid">
            <div class="service-image-inputs">
              <input v-model="serviceForm.image" type="text" placeholder="URL hoặc đường dẫn ảnh đại diện" />
              <label class="service-file-picker">
                <span>Chọn ảnh từ máy</span>
                <input type="file" accept="image/*" @change="handleImageFileChange" />
              </label>
              <p v-if="selectedImageName" class="muted small-text">Đã chọn: {{ selectedImageName }}</p>
              <p class="muted small-text">Ảnh file sẽ được giữ dưới dạng preview Data URL, còn đường dẫn assets được lưu ở metadata để sau đổi API upload.</p>
            </div>

            <div class="service-image-preview" :class="{ empty: !serviceForm.image }">
              <img v-if="serviceForm.image" :src="serviceForm.image" alt="Preview ảnh dịch vụ" />
              <div v-else>
                <strong>Chưa có ảnh</strong>
                <p>Chọn file hoặc dán URL để xem preview ngay ở đây.</p>
              </div>
            </div>
          </div>

          <div class="admin-form-actions">
            <button class="secondary-button" type="button" @click="goToStep(2)">Trở về</button>
            <button class="primary-button" type="button" @click="goToStep(4)">Hoàn thành</button>
          </div>
        </section>

        <section v-if="wizardStep === 3" class="service-form-section admin-form-span-2">
          <div class="service-form-section__header">
            <div>
              <p class="eyebrow">Mô tả</p>
              <h3>Giới thiệu ngắn và nội dung đặc thù</h3>
              <p class="muted small-text">Phần này hiển thị ở card và trang chi tiết, nên viết ngắn gọn, dễ đọc.</p>
            </div>
          </div>

          <div class="field-group">
            <label>Mô tả ngắn</label>
            <textarea v-model="serviceForm.shortDescription" rows="3" placeholder="Mô tả ngắn" />
          </div>
        </section>

        <section v-if="wizardStep === 4" class="service-form-section admin-form-span-2">
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
              <strong>{{ formatCurrencyVND(serviceForm.salePrice || 0) }}</strong>
            </div>
            <div class="service-review-item">
              <span>Số chỗ còn lại</span>
              <strong>{{ serviceForm.availableSlots || 0 }}</strong>
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

          <div class="service-review-item service-review-item--full">
            <span>Mô tả ngắn</span>
            <strong>{{ serviceForm.shortDescription || 'Chưa nhập mô tả ngắn.' }}</strong>
          </div>

          <div class="admin-form-actions">
            <button class="secondary-button" type="button" @click="goToStep(3)">Trở về</button>
            <button class="primary-button" type="button" @click="handleSubmitService">Đồng ý thêm dịch vụ</button>
          </div>
        </section>

        <small v-if="formError" class="error-text admin-form-span-2">{{ formError }}</small>
      </div>

      <div class="admin-table-wrapper">
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
                <p class="muted small-text">{{ service.shortDescription }}</p>
              </td>
              <td>{{ getCategoryLabel(service.categoryId) }}</td>
              <td>{{ service.destination }}, {{ service.province }}</td>
              <td>{{ formatCurrencyVND(service.salePrice) }}</td>
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

      <div v-if="deleteTargetServiceId" class="admin-confirm-overlay" @click.self="cancelDeleteService">
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
import { computed, reactive, ref } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { useServiceStore } from '@/stores/useServiceStore'
import { formatCurrencyVND } from '@/utils/formatters'

const store = useAdminStore()
const serviceStore = useServiceStore()
const categories = computed(() => serviceStore.categories)
const filters = reactive({
  keyword: '',
  categoryId: '',
  province: ''
})

const defaultForm = () => ({
  id: null,
  name: '',
  slug: '',
  categoryId: 'hotel',
  destination: '',
  province: '',
  price: 0,
  salePrice: 0,
  rating: 4.5,
  availableSlots: 10,
  status: 'active',
  image: '',
  gallery: [],
  shortDescription: '',
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
const wizardStep = ref(1)
const deleteTargetServiceId = ref('')

const createRoomType = (overrides = {}) => ({
  value: 'standard',
  label: 'Phòng tiêu chuẩn',
  priceMultiplier: 1,
  childSurcharge: 320000,
  ...overrides
})

const createTourDeparture = (overrides = {}) => ({
  departureId: '',
  startDate: '',
  endDate: '',
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

const stepItems = [
  { step: 1, title: 'Chọn loại dịch vụ', description: 'Khách sạn, tour hoặc vé tham quan.' },
  { step: 2, title: 'Nhập thông tin', description: 'Thông tin chung và cấu hình theo loại dịch vụ.' },
  { step: 3, title: 'Thêm ảnh và mô tả', description: 'Ảnh đại diện và mô tả hiển thị cho khách.' },
  { step: 4, title: 'Kiểm tra', description: 'Xác nhận toàn bộ thông tin trước khi lưu.' }
]

const categoryTabs = computed(() => categories.value.filter((category) => ['hotel', 'tour', 'ticket'].includes(String(category.id))))
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

  if (Number(serviceForm.price) < 0 || Number(serviceForm.salePrice) < 0 || Number(serviceForm.availableSlots) < 0) {
    formError.value = 'Giá và số chỗ không được nhỏ hơn 0.'
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
    if (tourDepartures.value.length === 0) {
      formError.value = 'Tour cần ít nhất 1 lịch khởi hành.'
      return false
    }

    const hasInvalidDeparture = tourDepartures.value.some((departure) => !departure.startDate || !departure.endDate)
    if (hasInvalidDeparture) {
      formError.value = 'Mỗi lịch khởi hành của tour cần có ngày đi và ngày về.'
      return false
    }
  }

  if (serviceForm.categoryId === 'ticket' && ticketPackages.value.length === 0) {
    formError.value = 'Vé tham quan cần ít nhất 1 gói vé.'
    return false
  }

  return true
}

const goToStep = (step) => {
  wizardStep.value = Math.min(4, Math.max(1, Number(step) || 1))
}

const goToStepThree = () => {
  formError.value = ''
  if (!validateCommonFields()) return
  if (!validateModelByCategory()) return
  goToStep(3)
}

const addRoomType = () => roomTypes.value.push(createRoomType({ value: `room-type-${roomTypes.value.length + 1}` }))
const removeRoomType = (index) => {
  if (roomTypes.value.length === 1) return
  roomTypes.value.splice(index, 1)
}

const addTourDeparture = () => tourDepartures.value.push(createTourDeparture({ departureId: `DEP-${tourDepartures.value.length + 1}` }))
const removeTourDeparture = (index) => {
  if (tourDepartures.value.length === 1) return
  tourDepartures.value.splice(index, 1)
}

const addTicketPackage = () => ticketPackages.value.push(createTicketPackage({ id: `pkg-${ticketPackages.value.length + 1}` }))
const removeTicketPackage = (index) => {
  if (ticketPackages.value.length === 1) return
  ticketPackages.value.splice(index, 1)
}

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
      childSurcharge: Number(roomType.childSurcharge || 320000) || 320000
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
      durationDays: Number(departure.durationDays || 3) || 3,
      durationNights: Number(departure.durationNights || 2) || 2,
      remainingSlots: Number(departure.remainingSlots || 10) || 10,
      priceOverride: Number(departure.priceOverride || 0) || 0
    }))
  }

  if (normalizedCategoryId === 'ticket') {
    ticketServiceType.value = sourceService?.ticketServiceType || 'Công viên giải trí'
    ticketChildPolicy.value = createTicketChildPolicy({ ...(sourceService?.ticketChildPolicy || {}) })
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
      featuresText: Array.isArray(ticketPackage.features) ? ticketPackage.features.join(', ') : String(ticketPackage.featuresText || '')
    }))
  }
}

const resetServiceForm = () => {
  Object.assign(serviceForm, defaultForm())
  formError.value = ''
  selectedImageName.value = ''
  syncModelFieldsForCategory(serviceForm.categoryId)
  isEditing.value = false
  wizardStep.value = 1
}

const startCreateService = () => {
  resetServiceForm()
  syncModelFieldsForCategory(serviceForm.categoryId)
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

const handleCategoryChange = () => {
  syncModelFieldsForCategory(serviceForm.categoryId)
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
  childSurcharge: Math.max(0, Number(roomType.childSurcharge || 0) || 0)
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

const handleSubmitService = () => {
  formError.value = ''
  if (wizardStep.value !== 4) return
  if (!validateCommonFields()) return
  if (!validateModelByCategory()) return

  const resolvedImage = serviceForm.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80'

  const basePayload = {
    ...serviceForm,
    image: resolvedImage,
    gallery: serviceForm.gallery.length ? serviceForm.gallery : [resolvedImage],
    amenities: serviceForm.amenities.length ? serviceForm.amenities : ['Hỗ trợ khách Việt', 'Xác nhận nhanh'],
    itinerary: serviceForm.itinerary.length ? serviceForm.itinerary : ['Lịch trình đang cập nhật'],
    description: serviceForm.description || serviceForm.shortDescription
  }

  try {
    if (serviceForm.categoryId === 'hotel') {
      store.saveService({
        ...basePayload,
        roomTypes: normalizeRoomTypesForSave()
      })
      resetServiceForm()
      return
    }

    if (serviceForm.categoryId === 'tour') {
      store.saveService({
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
      return
    }

    if (serviceForm.categoryId === 'ticket') {
      const normalizedTicketChildPolicy = normalizeTicketChildPolicyForSave()
      store.saveService({
        ...basePayload,
        ticketServiceType: ticketServiceType.value || 'Vé tham quan',
        ticketChildPolicy: normalizedTicketChildPolicy,
        ticketPackages: normalizeTicketPackagesForSave(),
        childSurcharge: Number(normalizedTicketChildPolicy.surcharge || 0)
      })
      resetServiceForm()
      return
    }

    store.saveService(basePayload)
    resetServiceForm()
  } catch (error) {
    formError.value = error.message
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