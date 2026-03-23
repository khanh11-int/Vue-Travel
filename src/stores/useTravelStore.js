import { readonly } from 'vue'
import { defineStore } from 'pinia'
import { useAdminStore } from '@/stores/useAdminStore'
import { useBookingStore } from '@/stores/useBookingStore'
import { useCatalogStore } from '@/stores/useCatalogStore'
import { useTravelCartStore } from '@/stores/useCartStore'
import { getTravelContextStore as useTravelContextStore } from '@/stores/getTravelContextStore'

export const useTravelStore = defineStore('travel', () => {
  const contextStore = useTravelContextStore()
  const catalogStore = useCatalogStore()
  const cartStore = useTravelCartStore()
  const bookingStore = useBookingStore()
  const adminStore = useAdminStore()

  contextStore.bootstrapState()

  return {
    state: readonly(contextStore.state),
    bootstrapState: contextStore.bootstrapState,

    featuredServices: catalogStore.featuredServices,
    wishlistItems: catalogStore.wishlistItems,
    activePromotions: catalogStore.activePromotions,
    getServiceBySlug: catalogStore.getServiceBySlug,
    getCommentsByService: catalogStore.getCommentsByService,
    toggleWishlist: catalogStore.toggleWishlist,

    cartItems: cartStore.cartItems,
    cartTotal: cartStore.cartTotal,
    addToCart: cartStore.addToCart,
    updateCartQuantity: cartStore.updateCartQuantity,
    removeCartItem: cartStore.removeCartItem,
    clearCart: cartStore.clearCart,
    applyPromotionCode: cartStore.applyPromotionCode,
    clearAppliedPromotion: cartStore.clearAppliedPromotion,
    calculatePromotionDiscount: cartStore.calculatePromotionDiscount,

    bookingHistory: bookingStore.bookingHistory,
    createBooking: bookingStore.createBooking,
    updateBookingStatus: bookingStore.updateBookingStatus,

    saveService: adminStore.saveService,
    toggleServiceStatus: adminStore.toggleServiceStatus,
    savePromotion: adminStore.savePromotion,
    togglePromotionStatus: adminStore.togglePromotionStatus,
    toggleCommentVisibility: adminStore.toggleCommentVisibility,
    deleteComment: adminStore.deleteComment,
    addComment: adminStore.addComment
  }
})
