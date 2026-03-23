import * as travelContextModule from '@/stores/useTravelContextStore'

const resolveStoreFactory = () => {
  if (typeof travelContextModule.useTravelContextStore === 'function') {
    return travelContextModule.useTravelContextStore
  }

  if (typeof travelContextModule.default === 'function') {
    return travelContextModule.default
  }

  throw new Error('Travel context store is unavailable.')
}

export const getTravelContextStore = () => {
  const storeFactory = resolveStoreFactory()
  return storeFactory()
}
