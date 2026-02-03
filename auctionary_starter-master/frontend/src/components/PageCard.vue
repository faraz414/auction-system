<template>
  <div class="page-card-wrapper">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="card bg-dark text-light border border-secondary shadow-sm">
            <div class="card-body p-4 p-md-5">
              <slot />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-card-wrapper {
  min-height: calc(100vh - 56px);
  background: #121212;
  padding: 2rem 0;
}
</style>
