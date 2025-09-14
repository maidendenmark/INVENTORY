import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Set Firestore log level to debug for development
setLogLevel('debug');

// Global variables for Firebase services
let app;
let db;
let auth;
let storage;
let userId;
let appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
let initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

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
const editProductIdInput = document.getElementById('editProductId');

// --- Functions for Modal ---
function showMessage(message) {
    messageText.textContent = message;
    messageModal.classList.remove('hidden');
}

window.hideMessage = function() {
    messageModal.classList.add('hidden');
}

// --- Firebase Initialization and Authentication ---
async function initializeFirebase() {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);

        // Sign in the user using the custom token or anonymously
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                console.log("User authenticated:", userId);
                await fetchInventory();
            } else {
                console.log("No user signed in.");
                // Clear the inventory list if no user is signed in
                inventoryList.innerHTML = '<div class="text-center text-gray-500 p-4">Please sign in to view your inventory.</div>';
            }
        });
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        showMessage("Failed to connect to the database. Please check the console for details.");
    }
}

// --- Inventory Management Functions ---

// Fetch and display inventory in real-time
async function fetchInventory() {
    const productsRef = collection(db, `artifacts/${appId}/users/${userId}/products`);
    onSnapshot(productsRef, (snapshot) => {
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        displayInventory(products);
    }, (error) => {
        console.error("Error fetching inventory: ", error);
        showMessage("Failed to load inventory. Please try again.");
    });
}

// Save a product to Firestore
async function saveProduct(productData, imageFile) {
    try {
        // Upload image to Firebase Storage if a file is provided
        if (imageFile) {
            const imageRef = ref(storage, `artifacts/${appId}/users/${userId}/product_images/${imageFile.name}`);
            const uploadResult = await uploadBytes(imageRef, imageFile);
            const imageUrl = await getDownloadURL(uploadResult.ref);
            productData.imageUrl = imageUrl;
        }

        if (productData.id) {
            // Update an existing product
            const productDocRef = doc(db, `artifacts/${appId}/users/${userId}/products/${productData.id}`);
            await updateDoc(productDocRef, productData);
            showMessage("Product updated successfully!");
        } else {
            // Add a new product
            const productsRef = collection(db, `artifacts/${appId}/users/${userId}/products`);
            await addDoc(productsRef, productData);
            showMessage("Product added successfully!");
        }
    } catch (e) {
        console.error("Error saving product: ", e);
        showMessage("Failed to save product. Please try again.");
    }
}

// Delete a product from Firestore
async function deleteProduct(productId) {
    try {
        const productDocRef = doc(db, `artifacts/${appId}/users/${userId}/products/${productId}`);
        await deleteDoc(productDocRef);
        showMessage("Product deleted successfully!");
    } catch (e) {
        console.error("Error deleting product: ", e);
        showMessage("Failed to delete product. Please try again.");
    }
}

// Display the inventory list
function displayInventory(products) {
    inventoryList.innerHTML = ''; // Clear existing list
    if (products.length === 0) {
        inventoryList.innerHTML = '<div class="text-center text-gray-500 p-4">No products found. Add some to get started!</div>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'bg-gray-50 p-4 rounded-lg shadow flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4';
        
        const imageUrl = product.imageUrl || 'https://placehold.co/100x100/e5e7eb/757575?text=No+Image';
        productCard.innerHTML = `
            <div class="flex-shrink-0">
                <img src="${imageUrl}" alt="${product.name}" onerror="this.onerror=null; this.src='https://placehold.co/100x100/e5e7eb/757575?text=No+Image'" class="w-24 h-24 object-cover rounded-md shadow-sm">
            </div>
            <div class="flex-1 text-center md:text-left">
                <h3 class="text-lg font-semibold text-gray-800">${product.name}</h3>
                <p class="text-gray-500 text-sm mt-1">${product.description || 'No description'}</p>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600 mt-2">
                    <p><strong>Size:</strong> ${product.size || 'N/A'}</p>
                    <p><strong>Box:</strong> ${product.box || 'N/A'}</p>
                    <p><strong>Price:</strong> $${(product.price || 0).toFixed(2)}</p>
                    <p><strong>Location:</strong> ${product.location || 'N/A'}</p>
                    <p><strong>Quantity:</strong> <span class="font-bold text-gray-800">${product.quantity}</span></p>
                </div>
            </div>
            <div class="flex-shrink-0 flex space-x-2">
                <button data-id="${product.id}" class="edit-btn px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300">Edit</button>
                <button data-id="${product.id}" class="delete-btn px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300">Delete</button>
            </div>
        `;
        inventoryList.appendChild(productCard);
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            const productToEdit = products.find(p => p.id === productId);
            if (productToEdit) {
                fillFormForEdit(productToEdit);
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            deleteProduct(productId);
        });
    });
}

// Fill the form with data of the product to be edited
function fillFormForEdit(product) {
    editProductIdInput.value = product.id;
    productNameInput.value = product.name;
    descriptionInput.value = product.description;
    sizeInput.value = product.size;
    boxInput.value = product.box;
    priceInput.value = product.price;
    locationInput.value = product.location;
    productQuantityInput.value = product.quantity;

    // Change button text and show cancel button
    addProductBtn.textContent = 'Save Changes';
    cancelEditBtn.classList.remove('hidden');
    fileInputText.textContent = 'Drag and drop or select a new image to replace';
}

// Reset form to add new product state
function resetForm() {
    productForm.reset();
    editProductIdInput.value = '';
    addProductBtn.textContent = 'Add Product';
    cancelEditBtn.classList.add('hidden');
    fileInputText.textContent = 'or drag and drop';
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', initializeFirebase);

productForm.addEventListener('submit', (e) => {
    e.preventDefault();
});

addProductBtn.addEventListener('click', async () => {
    const productId = editProductIdInput.value;
    const productName = productNameInput.value;
    const productQuantity = parseInt(productQuantityInput.value, 10);
    const price = parseFloat(priceInput.value);

    // Basic validation
    if (!productName || !productQuantity) {
        showMessage("Product Name and Quantity are required.");
        return;
    }

    const productData = {
        name: productName,
        description: descriptionInput.value,
        size: sizeInput.value,
        box: boxInput.value,
        price: isNaN(price) ? 0 : price,
        location: locationInput.value,
        quantity: productQuantity
    };

    if (productId) {
        productData.id = productId;
    }

    const imageFile = imageFileInput.files[0];
    await saveProduct(productData, imageFile);
    resetForm();
});

cancelEditBtn.addEventListener('click', resetForm);

// Add drag and drop functionality
imageFileInput.addEventListener('change', () => {
    if (imageFileInput.files.length > 0) {
        fileInputText.textContent = imageFileInput.files[0].name;
    } else {
        fileInputText.textContent = 'or drag and drop';
    }
});

const dropArea = document.querySelector('label[for="imageFileInput"]').parentElement.parentElement;

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('border-indigo-500');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('border-indigo-500');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('border-indigo-500');
    
    if (e.dataTransfer.files.length > 0) {
        imageFileInput.files = e.dataTransfer.files;
        fileInputText.textContent = imageFileInput.files[0].name;
    }
});
