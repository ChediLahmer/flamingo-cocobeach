<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar via-[#2a1030] to-primary-dark relative overflow-hidden"
  >
    <!-- Decorative blobs -->
    <div
      class="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
    ></div>
    <div
      class="absolute bottom-20 right-10 w-80 h-80 bg-accent/15 rounded-full blur-3xl"
    ></div>

    <div
      class="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-white/20"
    >
      <div class="flex justify-center mb-4">
        <div
          class="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30"
        >
          FC
        </div>
      </div>
      <h1
        class="font-display text-3xl text-center text-text tracking-wide mb-0"
      >
        FLAMINGO COUCOU BEACH
      </h1>
      <p class="text-center text-text-muted text-sm mb-8">
        Espace Administration
      </p>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text mb-1"
            >Mot de passe</label
          >
          <input
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
          />
        </div>
        <p v-if="error" class="text-danger text-sm">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-medium rounded-lg transition-all disabled:opacity-50 shadow-md shadow-primary/20"
        >
          {{ loading ? "Connexion..." : "Se connecter" }}
        </button>
        <div class="text-center">
          <router-link
            to="/forgot-password"
            class="text-sm text-primary hover:underline"
          >
            Mot de passe oublié ?
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { useApi } from "../composables/useApi";

const router = useRouter();
const { login } = useAuth();
const api = useApi();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  error.value = "";
  try {
    const { token } = await api.post("/auth/login", {
      email: email.value,
      password: password.value,
    });
    login(token);
    router.push("/");
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
