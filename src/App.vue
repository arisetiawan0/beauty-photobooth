<template>
  <div class="relative min-h-[100dvh] overflow-x-clip">
    <!-- Static brand glow, fixed so it never repaints on scroll -->
    <div aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div class="absolute -right-40 -top-48 size-[38rem] rounded-full bg-brand-200/60 blur-3xl"></div>
      <div class="absolute -bottom-56 -left-48 size-[34rem] rounded-full bg-sun/20 blur-3xl"></div>
    </div>

    <router-view v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
  </div>
</template>
