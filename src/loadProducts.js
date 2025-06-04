// Создаём observer один раз (глобально)
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const img = entry.target;

      if (entry.isIntersecting) {
        img.setAttribute("data-upscale", "true");
      } else {
        img.removeAttribute("data-upscale");
      }
    });
  },
  { threshold: 0.1 }
);

async function loadProducts() {
  try {
    const res = await fetch("https://fakestoreapi.com/products");
    const products = await res.json();

    const container = document.getElementById("product-grid");
    products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "bg-white rounded-xl shadow p-4 flex flex-col";

      card.innerHTML = `
        <div class="h-48 w-full flex items-center justify-center overflow-hidden relative mb-4">
        <img src="${product.image}" alt="${product.title}" class="h-48 object-contain" />
        </div>
        <h2 class="text-lg font-semibold mb-2">${product.title}</h2>
        <p class="text-gray-700 font-bold mb-2">$${product.price}</p>
        <p class="text-sm text-gray-600">${product.category}</p>
      `;

      container.appendChild(card);

      const img = card.querySelector("img");
      observer.observe(img);
    });
  } catch (error) {
    console.error("Ошибка при загрузке продуктов:", error);
  }
}

loadProducts();
