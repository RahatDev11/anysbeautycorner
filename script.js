let products = []; // প্রোডাক্ট ডাটা সরাসরি script.js ফাইলে থাকবে
let isAdmin = false;

// প্রোডাক্ট ডাটা
const initialProducts = [
{
    id: "1741365542569",
    name: "New টেস্ট",
    price: "999",
    category: "skincare",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741326248/sample.jpg",
    tags: "new,tag",
    description: "New product description"
  },
  {
        id: "1741892639007",
        name: "Milk shake",
        price: "1350",
        category: "skincare",
        image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741800877/1741800666769_dwffvp.jpg,https://res.cloudinary.com/dnvm88wfi/image/upload/v1741800880/1741800664520_cbqmfn.jpg,https://res.cloudinary.com/dnvm88wfi/image/upload/v1741800883/1741800668869_auxbid.jpg",
        tags: "Milk shake, মিল্ক শেক",
        description: "Milkshake Delivary done🥰🌿ও*জন বাড়ানোর জন্য আপনার পছন্দের সেরা পণ্যটি ডিসকাউন্ট মূল্যে লুফে নিন🥀🌿কোনোরকম এডভান্স করতে হবেনা!  পণ্য হাতে পেয়ে চেক করবেন এবং সবকিছু ঠিকঠাক থাকলে পেমেন্ট করবেন! 🪴১০০% অ*রিজিনাল এবং ১০০% জেনুইন প্রোডাক্ট দেওয়া হবে ইনশাআল্লাহ 💥👉 দাম মাত্র ১৩৫০ টাকা 👈এখনই অর্ডার করুন "
    },
    {
    id: "1741365542569",
    name: "New টেস্ট",
    price: "999",
    category: "skincare",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741326248/sample.jpg",
    tags: "new,tag",
    description: "New product description"
  },
  {
    id: "1741421645699",
    name: "T-shirt ",
    price: "5999",
    category: "cosmetics",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741412399/tshirt-8726716_1280_vyvosl.jpg,https://res.cloudinary.com/dnvm88wfi/image/upload/v1741412399/tshirt-7979852_1280_fn9tw2.jpg,https://res.cloudinary.com/dnvm88wfi/image/upload/v1741412399/tshirt-7979854_1280_jj0vhg.jpg",
    tags: "T-shirt, ganji, shirt, টিশার্ট, ",
    description: "টি-শার্ট বা টি হচ্ছে এক প্রকার শার্ট, যা ঘাড়ের অংশ থেকে দেহের ওপরাংশে কবন্ধের বেশিরভাগ স্থানকে ঢেকে রাখে। ইংরেজি 'টি' (T) আকৃতির ন্যায় দেখতে, তাই এ পোশাকটির নাম টি-শার্ট হয়েছে। টি-শার্টে সাধারণত কোনো বোতাম বা কলার থাকে না। সচারচর এটি হয় গোলাকার ও খাটো হাতাযুক্ত। যদিও কিছু ক্ষেত্রে মানুষ ভুলবশত খাটো হাতাযুক্ত যে-কোনো শার্ট বা ব্লাউজকেই টি-শার্ট ভেবে ভুল করে। পোলো শার্ট বা অন্যান্য কলারযুক্ত শার্ট প্রকৃতপক্ষে টি-শার্ট নয়। কারণ এ ধরনের শার্টের হাতা কাঁধের পাশ দিয়ে সামান্য একটু বাড়তি থাকে, এবং খাটো হাতার ক্ষেত্রে তা কনুই পর্যন্ত হতে পারে।"
  },
  {
    id: "1741365548108",
    name: "Dog",
    price: "5899",
    category: "skincare",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741326251/samples/animals/three-dogs.jpg",
    tags: "Dogs",
    description: "This is dogs"
  },
  {
    id: "1741365548109",
    name: "New Product",
    price: "999",
    category: "skincare",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741326248/sample.jpg",
    tags: "new,tag",
    description: "New product description"
  }
];

// প্রোডাক্ট ডাটা লোড করুন
function loadProductsFromData() {
  products = initialProducts; // সরাসরি initialProducts অ্যারে থেকে ডাটা লোড করুন
  localStorage.setItem('products', JSON.stringify(products)); // লোকাল স্টোরেজে সংরক্ষণ করুন
  loadProducts(); // প্রোডাক্ট লোড করুন
}

// মেনু টগল ফাংশন
function toggleMenu() {
    const dropdownMenu = document.getElementById("dropdownMenu");
    dropdownMenu.classList.toggle("hidden");
    dropdownMenu.classList.toggle("open");
}

// সাবমেনু টগল ফাংশন
function toggleSubMenuMobile(event) {
    event.stopPropagation();
    const subMenuMobile = document.getElementById("subMenuMobile");
    subMenuMobile.classList.toggle("hidden");
    subMenuMobile.classList.toggle("open");
}

// ডকুমেন্টে ক্লিক ইভেন্ট লিসেনার
document.addEventListener("click", (event) => {
    const dropdownMenu = document.getElementById("dropdownMenu");
    const subMenuMobile = document.getElementById("subMenuMobile");

    // মেনু বন্ধ করুন
    if (!event.target.closest('#dropdownMenu') && !event.target.closest('button[onclick="toggleMenu()"]')) {
        dropdownMenu.classList.add("hidden");
        dropdownMenu.classList.remove("open");
    }

    // সাবমেনু বন্ধ করুন
    if (!event.target.closest('#subMenuMobile') && !event.target.closest('button[onclick="toggleSubMenuMobile(event)"]')) {
        subMenuMobile.classList.add("hidden");
        subMenuMobile.classList.remove("open");
    }
});


// মোবাইল মেনু টগল
function toggleMenu() {
  const dropdownMenu = document.getElementById('dropdownMenu');
  dropdownMenu.classList.toggle('hidden');
}

// সাবমেনু টগল (ডেস্কটপ)
function toggleSubMenu() {
  const subMenu = document.getElementById('subMenu');
  subMenu.classList.toggle('hidden');
}

// সাবমেনু টগল (মোবাইল)
function toggleSubMenuMobile(event) {
  event.preventDefault();
  const subMenuMobile = document.getElementById('subMenuMobile');
  subMenuMobile.classList.toggle('hidden');
}


// মোডাল ব্যবস্থাপনা
function openModal(modalId) {
  document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

// এডমিন লগইন
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const number = document.getElementById("loginNumber").value;
  const password = document.getElementById("loginPassword").value;

  if (number === '01825620497' && password === '3012014') {
    closeModal('loginModal');
    document.getElementById('product-update').classList.remove("hidden");
    isAdmin = true;
  } else {
    alert('ভুল লগইন তথ্য!');
  }
});

// প্রোডাক্ট ফিল্টার ফাংশন
function filterProducts(category) {
    const filteredProducts = category === 'all' ? products : products.filter(product => product.category === category);
    loadProducts(filteredProducts);
}

// মেনু এবং সাবমেনু ক্লিক ইভেন্ট যোগ করুন
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        const category = e.target.getAttribute('href').replace('#', '');
        filterProducts(category);
    });
});

document.querySelectorAll('#subMenu a, #subMenuMobile a').forEach(link => {
    link.addEventListener('click', (e) => {
        const category = e.target.getAttribute('href').replace('#', '');
        filterProducts(category);
    });
});

// প্রোডাক্ট লোড করুন
function loadProducts(filteredProducts = products) {
  const productList = document.getElementById("productList");
  productList.innerHTML = ""; // প্রথমে সব প্রোডাক্ট ডিলিট করুন

  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer";
    card.setAttribute("data-product-id", product.id); // প্রোডাক্ট আইডি যোগ করুন
    card.onclick = () => showProductDetail(product.id);

    const imageLinks = product.image.split(',').map((img, index) =>
      `ছবি-${index + 1}: ${img.trim()}`).join('\n');

    const whatsappMessage = encodeURIComponent(`
প্রোডাক্টের নাম: ${product.name}
দাম: ${product.price} টাকা
${imageLinks}
আমি এই প্রোডাক্টটি কিনতে চাই!
    `);

    card.innerHTML = `
      <img src="${product.image.split(',')[0]}" class="w-full h-48 object-cover mb-4 rounded-lg">
      <h3 class="text-lg font-bold mb-2">${product.name}</h3>
      <p class="text-lipstick font-bold mb-2">দাম: ${product.price} টাকা</p>
      <p class="text-gray-600 mb-4">${product.description.substring(0, 80)}...</p>
      <div class="flex justify-between items-center">
        <button onclick="event.stopPropagation(); showProductDetail('${product.id}')" class="text-blue-500 hover:underline">বিস্তারিত দেখুন</button>
        <a href="https://wa.me/8801931866636?text=${whatsappMessage}" 
           target="_blank" 
           class="bg-lipstick text-white px-3 py-1 rounded text-sm hover:bg-lipstick-dark">
          কিনুন
        </a>
      </div>
    `;
    productList.appendChild(card);
  });
}

// প্রোডাক্ট ডিটেইল পেজে রিডাইরেক্ট
function showProductDetail(productId) {
  window.location.href = `product-detail.html?id=${productId}`;
}

// নতুন প্রোডাক্ট ডাটা জেনারেট করুন
document.getElementById("productForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const imageUrls = Array.from(document.querySelectorAll('#imageInputs input'))
    .map(input => input.value.trim())
    .filter(url => url);

  const newProduct = {
    id: Date.now().toString(),
    name: document.getElementById("productName").value,
    price: document.getElementById("productPrice").value,
    category: document.getElementById("productCategory").value,
    image: imageUrls.join(','),
    tags: document.getElementById("productTags").value.split(',').map(tag => tag.trim()),
    description: document.getElementById("productDescription").value
  };

  // প্রোডাক্ট ডেটা অ্যারে যোগ করুন
  products.push(newProduct);

  // লোকাল স্টোরেজে ডাটা আপডেট করুন
  localStorage.setItem('products', JSON.stringify(products));

  // প্রোডাক্ট লোড করুন
  loadProducts();

  // কোড জেনারেট করুন
  document.getElementById("generatedCode").textContent =
    `{
        id: "${newProduct.id}",
        name: "${newProduct.name}",
        price: "${newProduct.price}",
        category: "${newProduct.category}",
        image: "${newProduct.image}",
        tags: "${newProduct.tags.join(', ')}",
        description: "${newProduct.description}"
    },`;
});

// ছবি ফিল্ড যোগ করুন
function addImageField() {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'w-full p-2 border rounded mb-2';
  input.placeholder = 'ছবির লিংক';
  document.getElementById("imageInputs").appendChild(input);
}

// মোবাইল সার্চ বার ফোকাস
function focusMobileSearch() {
  const mobileSearchBar = document.getElementById('mobileSearchBar');
  mobileSearchBar.classList.toggle('hidden');
  mobileSearchBar.classList.toggle('show'); // নতুন ক্লাস যোগ
  document.getElementById('searchInput').focus();
}


// সার্চ ফাংশনালিটি (মোবাইল)
function searchProducts() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const searchResults = document.getElementById("searchResults");
  
  if (searchTerm.trim() === "") {
    searchResults.innerHTML = "";
    searchResults.classList.add("hidden");
    return;
  }
  
  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.tags.toLowerCase().includes(searchTerm)
  );
  displaySearchResults(filtered, searchResults);
}

// সার্চ ফাংশনালিটি (ডেস্কটপ)
function searchProductsDesktop() {
  const searchTerm = document.getElementById("searchInputDesktop").value.toLowerCase();
  const searchResults = document.getElementById("searchResultsDesktop");
  
  if (searchTerm.trim() === "") {
    searchResults.innerHTML = "";
    searchResults.classList.add("hidden");
    return;
  }
  
  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.tags.toLowerCase().includes(searchTerm)
  );
  displaySearchResults(filtered, searchResults);
}

// সার্চ রেজাল্ট ডিসপ্লে
function displaySearchResults(filteredProducts, searchResults) {
  searchResults.innerHTML = "";
  
  if (filteredProducts.length === 0) {
    searchResults.innerHTML = `<div class="p-2 text-gray-600">কোনো প্রোডাক্ট পাওয়া যায়নি</div>`;
  } else {
    filteredProducts.forEach(product => {
      const card = document.createElement("div");
      card.className = "p-2 hover:bg-gray-100 cursor-pointer";
      card.onclick = () => showProductDetail(product.id);
      
      card.innerHTML = `
        <div class="flex items-center">
          <img src="${product.image.split(',')[0]}" class="w-12 h-12 object-cover rounded-lg mr-4">
          <div>
            <h3 class="text-lg font-bold">${product.name}</h3>
            <p class="text-lipstick font-bold">দাম: ${product.price} টাকা</p>
          </div>
        </div>
      `;
      searchResults.appendChild(card);
    });
  }
  
  searchResults.classList.remove("hidden");
}


// স্ক্রল ইভেন্ট লিসেনার
window.addEventListener('scroll', () => {
  closeAllMenusOnScroll();
});

// স্ক্রল করলে মেনু এবং সার্চ বার ক্লোজ করার ফাংশন
function closeAllMenusOnScroll() {
  const subMenu = document.getElementById('subMenu');
  const subMenuMobile = document.getElementById('subMenuMobile');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const mobileSearchBar = document.getElementById('mobileSearchBar');

  // ডেস্কটপ সাবমেনু ক্লোজ করুন
  if (subMenu && !subMenu.classList.contains('hidden')) {
    subMenu.classList.add('hidden');
  }

  // মোবাইল সাবমেনু ক্লোজ করুন
  if (subMenuMobile && !subMenuMobile.classList.contains('hidden')) {
    subMenuMobile.classList.add('hidden');
  }

  // মোবাইল মেনু ক্লোজ করুন
  if (dropdownMenu && !dropdownMenu.classList.contains('hidden')) {
    dropdownMenu.classList.add('hidden');
  }

  // মোবাইল সার্চ বার ক্লোজ করুন
  if (mobileSearchBar && !mobileSearchBar.classList.contains('hidden')) {
    mobileSearchBar.classList.add('hidden');
  }
}
// কোড কপি করুন
function copyCode() {
  const code = document.getElementById("generatedCode").textContent;
  navigator.clipboard.writeText(code).then(() => {
    alert('কোড কপি করা হয়েছে!');
  });
}

// পণ্য দেখুন বাটনের জন্য স্ক্রোল ফাংশন
function scrollToProducts() {
  const productsSection = document.getElementById('products');
  if (productsSection) {
    productsSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// পণ্য দেখুন বাটনে ক্লিক করলে প্রোডাক্ট রিলোড করুন
function reloadProducts() {
  const productList = document.getElementById("productList");
  productList.innerHTML = ""; // প্রথমে সব প্রোডাক্ট ডিলিট করুন
  loadProductsFromData(); // তারপর প্রোডাক্ট লোড করুন
}

// প্রথম লোড
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#dropdownMenu') && !event.target.closest('button[onclick="toggleMenu()"]')) {
      document.getElementById("dropdownMenu").classList.remove("open");
    }
  });

  // URL থেকে প্রোডাক্ট আইডি প্যারামিটার নিন
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  // যদি প্রোডাক্ট আইডি থাকে, তাহলে সেই প্রোডাক্টের কার্ডে স্ক্রল করুন
  if (productId) {
    scrollToProduct(productId);
  }
});

// প্রথম লোড
document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromData(); // প্রোডাক্ট ডাটা লোড করুন
  loadProducts(); // প্রোডাক্টগুলো ডিসপ্লে করুন
});

// স্লাইডার বাটন ফাংশন
document.addEventListener('DOMContentLoaded', () => {
  const prevSlideBtn = document.getElementById('prevSlide');
  const nextSlideBtn = document.getElementById('nextSlide');

  if (prevSlideBtn && nextSlideBtn) {
    prevSlideBtn.addEventListener('click', () => {
      showPrevSlide();
    });

    nextSlideBtn.addEventListener('click', () => {
      showNextSlide();
    });
  }
});

// প্রোডাক্টের কার্ডে স্ক্রল করার ফাংশন
function scrollToProduct(productId) {
  const productCard = document.querySelector(`[data-product-id="${productId}"]`);
  if (productCard) {
    productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    productCard.classList.add('border-2', 'border-teal-500'); // কার্ডে হাইলাইট করুন
  }
}

// শেয়ার বাটন এবং সোশ্যাল মিডিয়া বাটন ব্যবস্থাপনা
document.getElementById('shareButton').addEventListener('click', (e) => {
  e.stopPropagation(); // ইভেন্ট বাবলিং বন্ধ করুন
  const socialIcons = document.getElementById('socialIcons');
  const shareButton = document.getElementById('shareButton');
  
  socialIcons.classList.toggle('hidden'); // সোশ্যাল আইকন টগল করুন
  shareButton.classList.toggle('hidden'); // শেয়ার বাটন টগল করুন
});

// স্ক্রিনে অন্য কোথাও ক্লিক করলে সোশ্যাল মিডিয়া বাটন লুকানো এবং শেয়ার বাটন দেখানো
document.addEventListener('click', (e) => {
  const socialIcons = document.getElementById('socialIcons');
  const shareButton = document.getElementById('shareButton');
  
  // যদি সোশ্যাল আইকন ওপেন থাকে এবং ক্লিক টার্গেট শেয়ার বাটন বা সোশ্যাল আইকন না হয়
  if (socialIcons && !socialIcons.classList.contains('hidden') && !e.target.closest('#shareButton') && !e.target.closest('#socialIcons')) {
    socialIcons.classList.add('hidden'); // সোশ্যাল আইকন লুকান
    shareButton.classList.remove('hidden'); // শেয়ার বাটন দেখান
  }
});

// সোশ্যাল মিডিয়া বাটনগুলোর উপর ক্লিক করলে ইভেন্ট বাবলিং বন্ধ করুন
document.getElementById('socialIcons').addEventListener('click', (e) => {
  e.stopPropagation();
});

// স্ক্রল করলে সোশ্যাল আইকন ক্লোজ এবং শেয়ার বাটন দেখানো
function closeSocialIconsOnScroll() {
  const socialIcons = document.getElementById('socialIcons');
  const shareButton = document.getElementById('shareButton');
  
  // সোশ্যাল আইকন ক্লোজ করুন
  if (socialIcons && !socialIcons.classList.contains('hidden')) {
    socialIcons.classList.add('hidden');
    shareButton.classList.remove('hidden'); // শেয়ার বাটন দেখান
  }
}

// স্ক্রল ইভেন্ট লিসেনার
window.addEventListener('scroll', closeSocialIconsOnScroll);
// লগইন ফর্ম খোলার জন্য সার্চ বার ইভেন্ট
document.getElementById('searchInput').addEventListener('input', function (e) {
  if (e.target.value === '3012014') {
    openModal('loginModal');
    e.target.value = ''; // সার্চ বার খালি করুন
  }
});

