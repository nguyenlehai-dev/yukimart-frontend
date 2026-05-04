<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '@/services/api'
import { newsArticles as fallbackArticles, newsCategories as fallbackCategories, type NewsArticle, type NewsCategory } from '../configs'

const newsArticles = ref<NewsArticle[]>(fallbackArticles)
const newsCategories = ref<NewsCategory[]>(fallbackCategories)

onMounted(async () => {
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
})
</script>

<template>
  <div class="ym-news">
    <div class="container">
      <!-- Page intro -->
      <div class="ym-news__intro">
        <h1 class="ym-news__page-title">Danh mục: Tin tức</h1>
        <p>Để có được làn da đẹp, trẻ trung bên cạnh việc lựa chọn mỹ phẩm trị mụn tốt và phù hợp với mình các bạn cũng cần biết cách sử dụng kem chống nắng đúng cách mới đem lại hiệu quả, nếu không sử dụng đúng có thể sẽ không đạt được hiệu quả mong muốn mà còn gây hại cho làn da của bạn.</p>
        <p>Lựa chọn sản phẩm chăm sóc da tốt chưa đủ để có được hiệu quả tối đa.</p>
        <p>Cách sử dụng thêm chi cả thứ tự sản phẩm mà bạn sử dụng chúng cũng có thể ảnh hưởng lớn đến hiệu quả của chúng.</p>
      </div>

      <div class="ym-news__layout">
        <!-- Main content -->
        <div class="ym-news__main">
          <article
            v-for="article in newsArticles"
            :key="article.id"
            class="ym-news__card-wrap"
          >
            <RouterLink :to="'/news/' + article.slug" class="ym-news__card" :aria-label="article.title">
              <div class="ym-news__card-img">
                <img :src="article.image" :alt="article.title || ''" loading="lazy" decoding="async" />
              </div>
              <div class="ym-news__card-body">
                <h2 class="ym-news__card-title">{{ article.title }}</h2>
                <p class="ym-news__card-excerpt">{{ article.excerpt }}</p>
                <span v-if="article.comments > 0" class="ym-news__card-comments">
                  {{ article.comments }} COMMENT
                </span>
              </div>
            </RouterLink>
          </article>
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
                v-for="article in newsArticles"
                :key="article.id"
                :to="'/news/' + article.slug"
                class="ym-news__recent-item"
              >
                <img :src="article.image" :alt="article.title" class="ym-news__recent-img" />
                <div class="ym-news__recent-info">
                  <span class="ym-news__recent-title">{{ article.title }}</span>
                  <span v-if="article.comments > 0" class="ym-news__recent-comments">
                    {{ article.comments }} Comment
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
