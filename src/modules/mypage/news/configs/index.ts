// News module mock data
import newsImg1 from '@/assets/images/products/deal/campaign/640x240-1773626638.jpg'
import newsImg2 from '@/assets/images/products/deal/campaign/Duocmypham640x2401685443000.jpg'
import newsImg3 from '@/assets/images/products/deal/campaign/640x240-1773226149.jpg'

export interface NewsArticle {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  image: string
  category: string
  author: string
  date: string
  comments: number
}

export interface NewsCategory {
  name: string
  count: number
}

export const newsCategories: NewsCategory[] = [
  { name: 'Hướng dẫn', count: 2 },
  { name: 'Tin tức', count: 3 },
]

export const newsArticles: NewsArticle[] = [
  {
    id: 1,
    slug: 'di-tim-5-loai-kem-chong-nang-vat-ly-tot-cho-lan-da',
    title: 'Đi tìm 5 loại kem chống nắng vật lý tốt cho làn da bạn gái châu Á',
    excerpt: 'Sử dụng kem chống nắng vật lý vừa bảo vệ cho làn da của bạn, ...',
    content: `<p>Sử dụng kem chống nắng vật lý vừa bảo vệ cho làn da của bạn, vừa góp phần bảo vệ môi trường sống xung quanh trở nên tốt hơn. Và đó cũng chính là "xu hướng mới" được các bạn gái châu Á chào đón nồng nhiệt.</p>
<p>Với khí hậu nhiệt đới có nắng gắt như Việt Nam, thật khó để bạn "tẩy chay" kem chống nắng ra khỏi thế giới chăm sóc da của riêng bạn.</p>
<p>Vì dù cho bạn có chăm sóc da kỹ lưỡng và tốt đến cỡ nào, thi bước bảo vệ làn da khỏi ánh nắng mặt trời vẫn luôn được đề cao hết mức. Nếu không thì cả một quá trình dưỡng da của bạn đều "đổ sông đổ biển" trong nay mai. Vì vậy, thiếu gì thì thiếu chứ không thể thiếu kem chống nắng bạn nhé!</p>
<p><strong>Đừng lo! Tất cả mọi điều bạn băn khoăn sẽ được Mai Hân mỹ phẩm "giải mã" ngay sau đây thôi.</strong></p>
<p>Tùy thuộc vào từng loại da, mà các bạn gái châu Á sẽ lựa chọn cho mình những sản phẩm kem chống nắng phù hợp. Bởi dù là kem chống nắng vật lý hay hóa học, thì chúng đều có những ưu khuyết điểm riêng cho nhau.</p>
<p>Tuy nhiên, chúng mình vẫn khuyến khích các bạn gái châu Á sử dụng kem chống nắng vật lý, vì đây là sản phẩm phù hợp với đa số các loại da, dễ sử dụng và tốt cho làn da châu Á, nhất là những bạn có làn da dây cảm sẽ không gây kích ứng da. Đặc biệt, là thành phần của kem rất thân thiện với môi trường, không gây nguy hại cho rặng san hô.</p>
<p>Và để dễ dàng hơn cho bạn trong việc đi tìm các sản phẩm kem chống nắng tốt cho da, Mai Hân mỹ phẩm sẽ "gợi ý" cho bạn 3 loại kem chống nắng vật lý tốt cho làn da châu Á, được nhiều chị em ưa chuộng và tin dùng trong suốt thời gian gần đây nhé.</p>`,
    image: newsImg1,
    category: 'Hướng dẫn, Tin tức',
    author: 'admin',
    date: '27/02/2019',
    comments: 0,
  },
  {
    id: 2,
    slug: 'top-8-kem-chong-nang-duoc-yeu-thich-nhat',
    title: 'Top 8 kem chống nắng được yêu thích nhất dành cho cô nàng da nhạy cảm',
    excerpt: 'Tia UV chính là "kẻ thù" gây ra tình trạng nám – sạm, lão hóa ...',
    content: `<p>Tia UV chính là "kẻ thù" gây ra tình trạng nám – sạm, lão hóa da. Vì vậy, việc sử dụng kem chống nắng hằng ngày là điều vô cùng cần thiết.</p>
<p>Tuy nhiên, đối với những cô nàng có làn da nhạy cảm thì việc lựa chọn kem chống nắng phù hợp không phải là điều đơn giản. Bởi lẽ, làn da nhạy cảm rất dễ bị kích ứng bởi các thành phần hóa học trong mỹ phẩm.</p>
<p>Hiểu được nỗi lo lắng đó, hôm nay YukiMart sẽ giới thiệu đến bạn top 8 kem chống nắng được yêu thích nhất dành cho cô nàng da nhạy cảm. Cùng tham khảo nhé!</p>`,
    image: newsImg2,
    category: 'Tin tức',
    author: 'admin',
    date: '15/03/2019',
    comments: 0,
  },
  {
    id: 3,
    slug: 'huong-dan-su-dung-my-pham-dung-cach',
    title: 'Hướng dẫn sử dụng mỹ phẩm đúng cách',
    excerpt: 'Với phụ nữ việc sở hữu một làn da trắng dáng và mềm mịn là ...',
    content: `<p>Với phụ nữ việc sở hữu một làn da trắng dáng và mềm mịn là điều mà ai cũng mong muốn. Chính vì vậy, việc sử dụng mỹ phẩm đúng cách là rất quan trọng.</p>
<p>Để có được làn da đẹp, trẻ trung bên cạnh việc lựa chọn mỹ phẩm trị mụn tốt và phù hợp với mình các bạn cũng cần biết cách sử dụng kem chống nắng đúng cách mới đem lại hiệu quả, nếu không sử dụng đúng có thể sẽ không đạt được hiệu quả mong muốn mà còn gây hại cho làn da của bạn.</p>
<p>Lựa chọn sản phẩm chăm sóc da tốt chưa đủ để có được hiệu quả tối đa.</p>
<p>Cách sử dụng thêm chi cả thứ tự sản phẩm mà bạn sử dụng chúng cũng có thể ảnh hưởng lớn đến hiệu quả của chúng.</p>`,
    image: newsImg3,
    category: 'Hướng dẫn',
    author: 'admin',
    date: '10/01/2019',
    comments: 1,
  },
]
