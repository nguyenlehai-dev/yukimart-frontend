<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { newsArticles as fallbackArticles, newsCategories as fallbackCategories, type NewsArticle, type NewsCategory } from '../configs'

const route = useRoute()

const newsArticles = ref<NewsArticle[]>(fallbackArticles)
const newsCategories = ref<NewsCategory[]>(fallbackCategories)
const currentArticle = ref<NewsArticle>(fallbackArticles.find(a => a.slug === route.params.slug) || fallbackArticles[0])

const article = computed(() => currentArticle.value)

async function loadSidebar() {
  try {
    const res = await api.get('/shop/news/public')
    const data = res.data.data || []
    if (data.length) {
      newsArticles.value = data.map((item: NewsArticle, idx: number) => ({
        ...item,
        image: item.image || fallbackArticles[idx % fallbackArticles.length]?.image || '',
      }))
      newsCategories.value = res.data.categories?.length ? res.data.categories : fallbackCategories
    }
  } catch {
    newsArticles.value = fallbackArticles
    newsCategories.value = fallbackCategories
  }
}

async function loadArticle(slug: string) {
  try {
    const res = await api.get(`/shop/news/slug/${encodeURIComponent(slug)}`)
    const fallback = fallbackArticles.find(a => a.slug === slug) || fallbackArticles[0]
    currentArticle.value = { ...res.data.data, image: res.data.data.image || fallback.image }
  } catch {
    currentArticle.value = fallbackArticles.find(a => a.slug === slug) || fallbackArticles[0]
  }
}

onMounted(loadSidebar)
watch(() => route.params.slug, (slug) => loadArticle(String(slug || '')), { immediate: true })
</script>

<template>
  <div class="ym-news">
    <div class="container">
      <div class="ym-news__layout">
        <!-- Main content - Article detail -->
        <div class="ym-news__main">
          <article class="ym-news__detail">
            <div class="ym-news__detail-meta">
              <span class="ym-news__detail-category">{{ article.category }}</span>
            </div>
            <h1 class="ym-news__detail-title">{{ article.title }}</h1>
            <p class="ym-news__detail-date">
              Posted on <strong>{{ article.date }}</strong> by <strong>{{ article.author }}</strong>
            </p>

            <div class="ym-news__detail-content" v-html="article.content"></div>

            <!-- Social share -->
            <div class="ym-news__detail-share" role="group" aria-label="Chia sẻ bài viết">
              <a href="#" aria-label="Chia sẻ qua Facebook" rel="noopener"><i class="ri-facebook-fill" aria-hidden="true"></i></a>
              <a href="#" aria-label="Chia sẻ qua X (Twitter)" rel="noopener"><i class="ri-twitter-x-fill" aria-hidden="true"></i></a>
              <a href="#" aria-label="Chia sẻ qua email"><i class="ri-mail-line" aria-hidden="true"></i></a>
              <a href="#" aria-label="Chia sẻ qua Pinterest" rel="noopener"><i class="ri-pinterest-fill" aria-hidden="true"></i></a>
              <a href="#" aria-label="Chia sẻ qua liên kết"><i class="ri-share-box-line" aria-hidden="true"></i></a>
            </div>
          </article>

          <!-- Comment form -->
          <form class="ym-news__comment-form" @submit.prevent>
            <h3>Trả lời</h3>
            <p class="ym-news__comment-note">
              Email của bạn sẽ không được hiển thị công khai. Các trường bắt buộc được đánh dấu <span aria-hidden="true">*</span>
            </p>
            <div class="ym-news__comment-field">
              <label for="news-comment">Bình luận</label>
              <textarea id="news-comment" rows="6" placeholder="Viết bình luận của bạn..."></textarea>
            </div>
            <div class="ym-news__comment-row">
              <div class="ym-news__comment-field">
                <label for="news-comment-name">Tên <span aria-hidden="true">*</span></label>
                <input id="news-comment-name" type="text" autocomplete="name" required />
              </div>
              <div class="ym-news__comment-field">
                <label for="news-comment-email">Email <span aria-hidden="true">*</span></label>
                <input id="news-comment-email" type="email" autocomplete="email" inputmode="email" required />
              </div>
              <div class="ym-news__comment-field">
                <label for="news-comment-url">Trang web</label>
                <input id="news-comment-url" type="url" autocomplete="url" inputmode="url" />
              </div>
            </div>
            <button type="submit" class="ym-news__comment-submit">PHẢN HỒI</button>
          </form>
        </div>

        <!-- Sidebar -->
        <aside class="ym-news__sidebar">
          <div class="ym-news__sidebar-box">
            <h3 class="ym-news__sidebar-title">Danh mục bài viết</h3>
            <ul class="ym-news__sidebar-list">
              <li v-for="cat in newsCategories" :key="cat.name">
                <a href="#">{{ cat.name }} ({{ cat.count }})</a>
              </li>
            </ul>
          </div>

          <div class="ym-news__sidebar-box">
            <h3 class="ym-news__sidebar-title">Bài viết mới cập nhật</h3>
            <div class="ym-news__recent">
              <RouterLink
                v-for="a in newsArticles"
                :key="a.id"
                :to="'/news/' + a.slug"
                class="ym-news__recent-item"
              >
                <img :src="a.image" :alt="a.title" class="ym-news__recent-img" />
                <div class="ym-news__recent-info">
                  <span class="ym-news__recent-title">{{ a.title }}</span>
                  <span v-if="a.comments > 0" class="ym-news__recent-comments">
                    {{ a.comments }} Comment
                  </span>
                </div>
              </RouterLink>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
