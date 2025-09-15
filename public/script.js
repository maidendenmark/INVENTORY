// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Set Firestore log level to debug for development
setLogLevel('debug');

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDo5dbZRR-C5ujtIzJTXGy0IbrAib03Kj8",
  authDomain: "model-folio-471517-n7.firebaseapp.com",
  databaseURL: "https://model-folio-471517-n7-default-rtdb.firebaseio.com",
  projectId: "model-folio-471517-n7",
  storageBucket: "model-folio-471517-n7.firebasestorage.app",
  messagingSenderId: "1027634906096",
  appId: "1:1027634906096:web:a8c81694692124a1ac1335"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Global variables for Firebase services
let db;
let auth;
let storage;
let userId;

let allProducts = [];
let currentEditingProductId = null;

// --- DOM Elements ---
const productForm = document.getElementById('productForm');
const productNameInput = document.getElementById('productNameInput');
const descriptionInput = document.getElementById('descriptionInput');
const sizeInput = document.getElementById('sizeInput');
const boxInput = document.getElementById('boxInput');
const priceInput = document.getElementById('priceInput');
const locationInput = document.getElementById('locationInput');
const productQuantityInput = document.getElementById('productQuantityInput');
const imageFileInput = document.getElementById('imageFileInput');
const fileInputText = document.getElementById('fileInputText');
const addProductBtn = document.getElementById('addProductBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const inventoryList = document.getElementById('inventoryList');
const messageModal = document.getElementById('messageModal');
const messageText = document.getElementById('messageText');
const searchInput = document.getElementById('searchInput');

// --- Functions for Modal ---
function showMessage(message) {
    messageText.textContent = message;
    messageModal.classList.remove('hidden');
}

window.hideMessage = function() {
    messageModal.classList.add('hidden');
}

// --- Firebase Initialization  Authentication ---
async function initializeFirebaseServices() {
    try {
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);

        await signInAnonymously(auth);

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                console.log("User authenticated:", userId);
                fetchInventory();
            } else {
                console.log("No user signed in.");
                inventoryList.innerHTML = '<div class="text-center text-gray-500 p-4">Please sign in to view your inventory.</div>';
            }
        });
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        showMessage("Failed to connect to the database. Please check the console for details.");
    }
}

// --- Core Inventory of Functions ---
async function fetchInventory() {
    if (!userId) {
        return;
    }

    const productsRef = collection(db, `users/${userId}/products`);
// Real-time listener for inventory changes
    onSnapshot(productsRef, (querySnapshot) => {
        allProducts = [];
        querySnapshot.forEach((doc) => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        renderInventory(allProducts);
    }, (error) => {
        console.error("Error fetching inventory:", error);
        showMessage("Error fetching inventory data.");
    });
}

function renderInventory(products) {
    inventoryList.innerHTML = '';
    if (products.length === 0) {
        inventoryList.innerHTML = '<p class="text-center text-gray-500">No products found. Add a new product to get started!</p>';
        return;
    }

    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('bg-white', 'p-4', 'rounded-lg', 'shadow-md', 'flex', 'flex-col', 'gap-4', 'md:flex-row', 'md:items-center');
        
        const detailsHtml = `
            <div class="flex-grow">
                <h3 class="font-bold text-lg">${product.productName}</h3>
                <p class="text-sm text-gray-600">${product.description || ''}</p>
                <p class="text-sm text-gray-600">Size: ${product.size || 'N/A'}</p>
                <p class="text-sm text-gray-600">Box: ${product.box || 'N/A'}</p>
                <p class="text-sm text-gray-600">Price: $${product.price ? product.price.toFixed(2) : 'N/A'}</p>
                <p class="text-sm text-gray-600">Location: ${product.location || 'N/A'}</p>
                <p class="text-sm text-gray-600">Quantity: ${product.productQuantity || 0}</p>
            </div>
            ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.productName}" class="w-24 h-24 object-cover rounded-md flex-shrink-0" />` : ''}
        `;
        productItem.innerHTML = detailsHtml;

        const actionButtons = document.createElement('div');
        actionButtons.classList.add('flex', 'flex-row', 'gap-2', 'md:flex-col', 'md:items-end', 'md:gap-1');
        
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('bg-blue-500', 'text-white', 'px-3', 'py-1', 'rounded-md', 'hover:bg-blue-600');
        editButton.onclick = () => editProduct(product.id);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('bg-red-500', 'text-white', 'px-3', 'py-1', 'rounded-md', 'hover:bg-red-600');
        deleteButton.onclick = () => deleteProduct(product.id);

        actionButtons.append(editButton, deleteButton);
        productItem.append(actionButtons);
        inventoryList.appendChild(productItem);
    });
}

async function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        showMessage("Product not found.");
        return;
    }
    
    currentEditingProductId = product.id;
    
    productNameInput.value = product.productName;
    descriptionInput.value = product.description;
    sizeInput.value = product.size;
    boxInput.value = product.box;
    priceInput.value = product.price;
    locationInput.value = product.location;
    productQuantityInput.value = product.productQuantity;
    
    addProductBtn.textContent = 'Save Changes';
    cancelEditBtn.classList.remove('hidden');

    productForm.scrollIntoView({ behavior: 'smooth' });
}

async function deleteProduct(productId) {
    if (confirm("Are you sure you want to delete this product?")) {
        try {
            const docRef = doc(db, `users/${userId}/products`, productId);
            await deleteDoc(docRef);
            showMessage("Product deleted successfully!");
        } catch (error) {
            console.error("Error deleting product:", error);
            showMessage("Failed to delete product.");
        }
    }
}

// --- Event Listeners ---
productForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const productName = productNameInput.value;
    const description = descriptionInput.value;
    const size = sizeInput.value;
    const box = boxInput.value;
    const price = parseFloat(priceInput.value);
    const location = locationInput.value;
    const productQuantity = parseInt(productQuantityInput.value);
    const imageFile = imageFileInput.files[0];

    if (!productName || isNaN(productQuantity)) {
        showMessage("Product Name and a valid Quantity are required.");
        return;
    }

    let imageUrl = '';
    if (imageFile) {
        try {
            const imageRef = ref(storage, `${userId}/products/${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            imageUrl = await getDownloadURL(imageRef);
            console.log("Image uploaded:", imageUrl);
        } catch (error) {
            console.error("Error uploading image:", error);
            showMessage("Failed to upload image.");
            return;
        }
    }

    const productData = {
        productName,
        description,
        size,
        box,
        price,
        location,
        productQuantity,
        imageUrl,
        createdAt: new Date()
    };

    try {
        if (currentEditingProductId) {
            const docRef = doc(db, `users/${userId}/products`, currentEditingProductId);
            await updateDoc(docRef, productData);
            showMessage("Product updated!");
        } else {
            const collectionRef = collection(db, `users/${userId}/products`);
            await addDoc(collectionRef, productData);
            showMessage("Product added!");
        }
        productForm.reset();
        cancelEditBtn.classList.add('hidden');
        addProductBtn.textContent = 'Add Product';
        currentEditingProductId = null;
    } catch (error) {
        console.error("Error adding/updating product:", error);
        showMessage("An error occurred. Please try again.");
    }
});

cancelEditBtn.addEventListener('click', () => {
    productForm.reset();
    cancelEditBtn.classList.add('hidden');
    addProductBtn.textContent = 'Add Product';
    currentEditingProductId = null;
});

imageFileInput.addEventListener('change', (event) => {
    if (event.target.files.length > 0) {
        fileInputText.textContent = event.target.files[0].name;
    } else {
        fileInputText.textContent = 'No file chosen';
    }
});

searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filteredProducts = allProducts.filter(product =>
        product.productName.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        (product.location && product.location.toLowerCase().includes(searchTerm))
    );
    renderInventory(filteredProducts);
});

// --- Final step: Start the application ---
initializeFirebaseServices();