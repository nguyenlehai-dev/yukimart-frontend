<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { newsArticles, newsCategories } from '../configs'

const route = useRoute()

const article = computed(() => {
  return newsArticles.find(a => a.slug === route.params.slug) || newsArticles[0]
})
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
            <div class="ym-news__detail-share">
              <a href="#"><i class="ri-facebook-fill"></i></a>
              <a href="#"><i class="ri-twitter-x-fill"></i></a>
              <a href="#"><i class="ri-mail-line"></i></a>
              <a href="#"><i class="ri-pinterest-fill"></i></a>
              <a href="#"><i class="ri-share-box-line"></i></a>
            </div>
          </article>

          <!-- Comment form -->
          <div class="ym-news__comment-form">
            <h3>Trả lời</h3>
            <p class="ym-news__comment-note">
              Email của bạn sẽ không được hiển thị công khai. Các trường bắt buộc được đánh dấu *
            </p>
            <div class="ym-news__comment-field">
              <label>Bình luận</label>
              <textarea rows="6" placeholder="Viết bình luận của bạn..."></textarea>
            </div>
            <div class="ym-news__comment-row">
              <div class="ym-news__comment-field">
                <label>Tên *</label>
                <input type="text" />
              </div>
              <div class="ym-news__comment-field">
                <label>Email *</label>
                <input type="email" />
              </div>
              <div class="ym-news__comment-field">
                <label>Trang web</label>
                <input type="url" />
              </div>
            </div>
            <button class="ym-news__comment-submit">PHẢN HỒI</button>
          </div>
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
