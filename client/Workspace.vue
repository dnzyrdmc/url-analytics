<script setup>
import { ref, onMounted } from "vue";
import { api, act } from "./api";
const links = ref([]),
  target = ref("https://example.com"),
  expires = ref(""),
  stats = ref([]),
  current = ref("");
async function load() {
  links.value = await api("/links");
}
onMounted(() => act(load, ""));
</script>
<template>
  <form
    class="panel"
    @submit.prevent="
      act(async () => {
        await api('/links', 'POST', {
          target,
          expires: expires ? new Date(expires).toISOString() : null,
        });
        await load();
      })
    "
  >
    <h2>Kısa bağlantı oluştur</h2>
    <div class="toolbar">
      <label>Hedef URL<input v-model="target" type="url" required /></label
      ><label
        >Son kullanım (opsiyonel)<input
          v-model="expires"
          type="datetime-local" /></label
      ><button>Oluştur</button>
    </div>
  </form>
  <section class="panel">
    <h2>Bağlantılarım</h2>
    <div class="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Kısa adres</th>
            <th>Hedef</th>
            <th>Tıklama</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in links">
            <td>
              <a :href="'/r/' + l.code" target="_blank">/r/{{ l.code }}</a>
            </td>
            <td>{{ l.target }}</td>
            <td>{{ l.clicks }}</td>
            <td>
              <div class="actions">
                <button
                  class="ghost small"
                  @click="
                    act(async () => {
                      stats = await api('/links/' + l.id + '/stats');
                      current = l.code;
                      await load();
                    }, '')
                  "
                >
                  İstatistik</button
                ><button
                  class="small"
                  @click="
                    act(async () => {
                      await api('/links/' + l.id, 'PATCH', {
                        enabled: !l.enabled,
                      });
                      await load();
                    })
                  "
                >
                  {{ l.enabled ? "Kapat" : "Aç" }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!links.length" class="empty">İlk kısa bağlantını oluştur.</p>
  </section>
  <section v-if="current" class="panel">
    <h2>{{ current }} · günlük ziyaretler</h2>
    <div v-for="s in stats" class="card">
      {{ s.day }} <strong>{{ s.clicks }} tıklama</strong>
    </div>
    <p v-if="!stats.length">
      Henüz tıklama yok. Kısa bağlantıyı açıp istatistiği yenile.
    </p>
  </section>
</template>
