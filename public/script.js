// --- Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, addDoc, updateDoc, deleteDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

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

// Initialize a Firebase app
const app = initializeApp(firebaseConfig);

// Global variables for Firebase services
let db;
let auth;
let storage;
let userId;

let allProducts = [];
let currentEditingProductId = null;

// --- DOM Elements ---
const loginOverlay = document.getElementById('loginOverlay');
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

// --- AUTHENTICATION ELEMENTS ---
const loginStatusDiv = document.getElementById('login-status');
const inventorySection = document.getElementById('inventorySection');

// --- Functions for Modal ---
function showMessage(message) {
    messageText.textContent = message;
    messageModal.classList.remove('hidden');
    setTimeout(() => {
        messageModal.classList.add('hidden');
    }, 3000);
}

window.hideMessage = function() {
    messageModal.classList.add('hidden');
}

// --- Firebase Initialization and Authentication ---
function initializeFirebaseServices() {
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log("User signed in:", user.email);
            userId = user.uid;
            
            // Show the main content and hide the login overlay
            loginOverlay.style.display = 'none';
            inventorySection.style.display = 'block';
            
            // The login status for the main header
            const loggedInStatusDiv = document.getElementById('login-status-loggedin');
            if (loggedInStatusDiv) {
                loggedInStatusDiv.innerHTML = `<span class="text-gray-600">Signed in as: ${user.displayName || user.email}</span> <button id="signOutButton" class="bg-red-500 text-white px-2 py-1 ml-2 rounded hover:bg-red-600 transition-colors">Sign Out</button>`;
            
                document.getElementById('signOutButton').addEventListener('click', () => {
                    signOut(auth);
                });
            }
            
            fetchInventory();
        } else {
            // No user signed in
            console.log("No user signed in.");
            userId = null;
            
            // Show the login overlay and hide the main content
            loginOverlay.style.display = 'flex';
            inventorySection.style.display = 'none';

            // The login button is styled correctly in your CSS
            loginStatusDiv.innerHTML = `<button id="login-button" class="bg-pink-300 text-gray-800 px-4 py-2 rounded">Sign In with Google</button>`;
            
            document.getElementById('login-button').addEventListener('click', () => {
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({
                    prompt: 'select_account'
                });
                signInWithPopup(auth, provider);
            });
            
            inventoryList.innerHTML = '<div class="text-center text-gray-500 p-4">Please sign in to view your inventory.</div>';
        }
    });
}

// --- Core Inventory Functions ---
async function fetchInventory() {
    if (!userId) {
        return;
    }
    
    inventoryList.innerHTML = '<div class="text-center text-gray-500 p-4">Loading inventory...</div>';

    const productsRef = collection(db, `users/${userId}/products`);
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
        productItem.id = `product-${product.id}`;
        productItem.classList.add('bg-white', 'p-4', 'rounded-xl', 'shadow-md', 'flex', 'flex-col', 'gap-4', 'md:flex-row', 'md:items-center', 'mb-4');
        
        const detailsHtml = `
            <div class="flex-grow">
                <h3 class="font-bold text-lg text-gray-800">${product.productName}</h3>
                <p class="text-sm text-gray-600">${product.description || ''}</p>
                <p class="text-sm text-gray-600">Quantity: <span class="text-gray-700">${product.productQuantity || 0}</span></p>
                <p class="text-sm text-gray-600">Size: <span class="text-gray-700">${product.size || 'N/A'}</span></p>
                <p class="text-sm text-gray-600">Box: <span class="text-gray-700">${product.box || 'N/A'}</span></p>
                <p class="text-sm text-gray-600">Price: <span class="text-gray-700">$${product.price ? product.price.toFixed(2) : 'N/A'}</span></p>
                <p class="text-sm text-gray-600">Location: <span class="text-gray-700">${product.location || 'N/A'}</span></p>
            </div>
            ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.productName}" class="w-24 h-24 object-cover rounded-lg flex-shrink-0" />` : ''}
        `;
        productItem.innerHTML = detailsHtml;

        const actionButtons = document.createElement('div');
        actionButtons.classList.add('flex', 'flex-row', 'gap-2', 'md:flex-col', 'md:items-end', 'md:gap-1');
        
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('bg-blue-500', 'text-white', 'px-3', 'py-1', 'rounded-md', 'text-sm', 'hover:bg-blue-600', 'transition-colors');
        editButton.onclick = () => editProduct(product.id);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('bg-red-500', 'text-white', 'px-3', 'py-1', 'rounded-md', 'text-sm', 'hover:bg-red-600', 'transition-colors');
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
            const product = allProducts.find(p => p.id === productId);
            if (product.imageUrl) {
                const imageRef = ref(storage, `users/${userId}/products/${product.imageUrl.split('%2F').pop().split('?alt=')[0]}`);
                await deleteObject(imageRef);
            }

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

    if (!userId) {
        showMessage("Please sign in to add or edit products.");
        return;
    }

    const productName = productNameInput.value.trim();
    const description = descriptionInput.value.trim();
    const size = sizeInput.value.trim();
    const box = boxInput.value.trim();
    const price = parseFloat(priceInput.value);
    const location = locationInput.value.trim();
    const productQuantity = parseInt(productQuantityInput.value);
    const imageFile = imageFileInput.files[0];

    if (!productName || isNaN(productQuantity)) {
        showMessage("Product Name and a valid Quantity are required.");
        return;
    }

    let imageUrl = '';
    if (imageFile) {
        try {
            const imageRef = ref(storage, `users/${userId}/products/${imageFile.name}`);
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
        price: isNaN(price) ? null : price,
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
        fileInputText.textContent = 'No file chosen';
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
    fileInputText.textContent = 'No file chosen';
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
        (product.box && product.box.toLowerCase().includes(searchTerm)) ||
        (product.location && product.location.toLowerCase().includes(searchTerm))
    );
    renderInventory(filteredProducts);
});

// Final step: Start the application
initializeFirebaseServices();