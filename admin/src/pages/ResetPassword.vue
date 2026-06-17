<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar via-[#2a1030] to-primary-dark relative overflow-hidden"
  >
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
        class="font-display text-2xl text-center text-text tracking-wide mb-1"
      >
        Nouveau mot de passe
      </h1>
      <p class="text-center text-text-muted text-sm mb-8">
        Choisissez un nouveau mot de passe
      </p>

      <div v-if="success" class="text-center space-y-4">
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl"
        >
          ✓
        </div>
        <p class="text-sm text-text">Mot de passe mis à jour avec succès !</p>
        <router-link
          to="/login"
          class="inline-block mt-4 py-2.5 px-6 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-lg hover:from-primary-dark hover:to-primary transition-all"
        >
          Se connecter
        </router-link>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-text mb-1"
            >Nouveau mot de passe</label
          >
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text mb-1"
            >Confirmer le mot de passe</label
          >
          <input
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
          />
        </div>
        <p v-if="error" class="text-danger text-sm">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-medium rounded-lg transition-all disabled:opacity-50 shadow-md shadow-primary/20"
        >
          {{ loading ? "Mise à jour..." : "Réinitialiser" }}
        </button>
        <div class="text-center">
          <router-link to="/login" class="text-sm text-primary hover:underline">
            ← Retour à la connexion
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "../composables/useApi";

const route = useRoute();
const router = useRouter();
const api = useApi();

const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");
const success = ref(false);

const token = route.query.token;

if (!token) {
  router.push("/login");
}

async function handleSubmit() {
  error.value = "";

  if (password.value.length < 8) {
    error.value = "Le mot de passe doit contenir au moins 8 caractères";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Les mots de passe ne correspondent pas";
    return;
  }

  loading.value = true;
  try {
    await api.post("/auth/reset-password", {
      token,
      password: password.value,
    });
    success.value = true;
  } catch {
    error.value = "Lien invalide ou expiré. Veuillez refaire une demande.";
  } finally {
    loading.value = false;
  }
}
</script>
