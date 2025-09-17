// --- Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithCredential } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, addDoc, updateDoc, deleteDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

// Global variables for Firebase services
let db;
let auth;
let storage;
let userId;

let allProducts = [];
let currentEditingProductId = null;

// --- DOM Elements ---
const loginOverlay = document.getElementById('loginOverlay');
const appContainer = document.getElementById('appContainer');
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
const userDisplay = document.getElementById('user-display');
const signOutBtn = document.getElementById('signOutBtn');

// **IMPORTANT: Replace these placeholder values with your actual Firebase configuration.**
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const googleClientId = "YOUR_GOOGLE_CLIENT_ID";

// --- Functions for Modal ---
function showMessage(message) {
    messageText.textContent = message;
    messageModal.classList.add('visible-visually');
    messageModal.classList.remove('hidden-visually');
    setTimeout(() => {
        messageModal.classList.remove('visible-visually');
        messageModal.classList.add('hidden-visually');
    }, 3000);
}

// Corrected Google Sign-in Callback
window.handleCredentialResponse = async (response) => {
    try {
        const id_token = response.credential;
        // Create a Firebase credential from the Google ID token
        const credential = GoogleAuthProvider.credential(id_token);

        // Sign in with Firebase using the credential
        await signInWithCredential(auth, credential);
    } catch (error) {
        console.error("Error with Google Sign-In:", error);
        showMessage("Failed to sign in. Please try again.");
    }
};

// --- Firebase Initialization and Authentication ---
function initializeFirebaseServices() {
    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        
        // Use the JavaScript initialize and render functions
        google.accounts.id.initialize({
            client_id: googleClientId,
            callback: window.handleCredentialResponse
        });
        google.accounts.id.renderButton(
            document.getElementById('google-button-div'),
            { type: "standard" }
        );

        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("User signed in:", user.email);
                userId = user.uid;
                userDisplay.textContent = `Hello, ${user.displayName || user.email}`;
                
                loginOverlay.classList.remove('visible-visually');
                loginOverlay.classList.add('hidden-visually');
                appContainer.classList.add('visible-visually');
                appContainer.classList.remove('hidden-visually');

                fetchInventory();
            } else {
                console.log("No user signed in.");
                userId = null;
                userDisplay.textContent = '';
                
                appContainer.classList.add('hidden-visually');
                appContainer.classList.remove('visible-visually');
                loginOverlay.classList.add('visible-visually');
                loginOverlay.classList.remove('hidden-visually');
                
                inventoryList.innerHTML = '<div class="text-center text-gray-500 p-4">Please sign in to view your inventory.</div>';
            }
        });
    } catch (error) {
        console.error("Initialization error:", error);
        showMessage("Failed to initialize the application. Please try again later.");
    }
}

// Sign Out button logic
if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
        signOut(auth);
    });
}

// --- Core Inventory Functions ---
async function fetchInventory() {
    if (!userId) return;
    
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
            ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.productName}" class="w-24 h-24 object-cover rounded-lg flex-shrink-0" />` : ''}
            <div class="flex-grow">
                <h3 class="font-bold text-lg text-gray-800">${product.productName}</h3>
                <p class="text-sm text-gray-600">${product.description || ''}</p>
                <p class="text-sm text-gray-600">Quantity: <span class="text-gray-700">${product.productQuantity || 0}</span></p>
                <p class="text-sm text-gray-600">Size: <span class="text-gray-700">${product.size || 'N/A'}</span></p>
                <p class="text-sm text-gray-600">Box: <span class="text-gray-700">${product.box || 'N/A'}</span></p>
                <p class="text-sm text-gray-600">Price: <span class="text-gray-700">$${product.price ? parseFloat(product.price).toFixed(2) : 'N/A'}</span></p>
                <p class="text-sm text-gray-600">Location: <span class="text-gray-700">${product.location || 'N/A'}</span></p>
            </div>
        `;
        productItem.innerHTML = detailsHtml;

        const actionButtons = document.createElement('div');
        actionButtons.classList.add('flex', 'flex-row', 'gap-2', 'md:flex-col', 'md:items-end', 'md:gap-1');
        
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('bg-indigo-500', 'text-white', 'px-3', 'py-1', 'rounded-md', 'text-sm', 'hover:bg-indigo-600', 'transition-colors');
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
    descriptionInput.value = product.description || '';
    sizeInput.value = product.size || '';
    boxInput.value = product.box || '';
    priceInput.value = product.price || '';
    locationInput.value = product.location || '';
    productQuantityInput.value = product.productQuantity || '';
    
    addProductBtn.textContent = 'Save Changes';
    cancelEditBtn.classList.remove('hidden');

    productForm.scrollIntoView({ behavior: 'smooth' });
}

async function deleteProduct(productId) {
    if (confirm("Are you sure you want to delete this product?")) {
        try {
            const product = allProducts.find(p => p.id === productId);
            if (product && product.imageFilename) {
                const imageRef = ref(storage, `users/${userId}/products/${product.imageFilename}`);
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
    let imageFilename = '';

    if (imageFile) {
        try {
            imageFilename = `${Date.now()}_${imageFile.name}`;
            const imageRef = ref(storage, `users/${userId}/products/${imageFilename}`);
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
        description: description || null,
        size: size || null,
        box: box || null,
        price: isNaN(price) ? null : price,
        location: location || null,
        productQuantity: productQuantity || 0,
        imageUrl: imageUrl || null,
        imageFilename: imageFilename || null,
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
window.onload = initializeFirebaseServices;