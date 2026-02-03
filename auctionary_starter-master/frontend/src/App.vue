<template>
  <div id="layout-root">
    <!-- NAVBAR -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary">
      <div class="container-fluid px-4">
        <router-link class="navbar-brand fw-bold fs-4" to="/">
          ConsoleBid
        </router-link>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navLinks"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navLinks">
          <ul class="navbar-nav ms-auto fs-5">
            <li class="nav-item"><router-link class="nav-link" to="/">Home</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/register">Register</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/login">Login</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/profile">Profile</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/create">Create Auction</router-link></li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- FULL WIDTH PAGE CONTENT -->
    <main class="page-area">
      <router-view />
    </main>
  </div>
</template>

<style>
html,
body,
#app,
#layout-root {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  background: #121212;
  color: #e8e8e8;
}

.page-area {
  width: 100%;
  min-height: calc(100vh - 56px);
}

html,
body,
#app {
  background: #121212;
  color: #e5e7eb; /* light readable text */
}

h1, h2, h3, h4, h5 {
  color: #ffffff;
}

</style>
