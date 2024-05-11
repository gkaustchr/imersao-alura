import { GoogleGenerativeAI } from "@google/generative-ai";
const loading = document.querySelector('.content-loading')
const contentImage = document.querySelector('#content-images')
const article = document.querySelector('article')
let data = []

// Fetch your API_KEY
const API_KEY = "AIzaSyBQ_7YmW7JNrXSKL20Mpj_0mUUPqWXQza0";

// Esta função permite acessar a chave da API
const genAI = new GoogleGenerativeAI(API_KEY);

// Converte um objeto Arquivo para um objeto Part do Google Generative AI.
async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}

// Esta função recebe o retorno da API, verifica se pode exibir a imagem e cria os componentes necessários para exibir os dados.
const addItemView = (text, file) => {
    if (text[text.length - 1].prohibited)
        return indisponivel()
    const div = document.createElement('div')
    const image = document.createElement('img')
    image.src = `data:${file[0]?.inlineData?.mimeType};base64,` + file[0]?.inlineData?.data
    const details = document.createElement('details')
    const summary = document.createElement('summary')
    summary.innerText = text[text.length - 1]?.description
    details.appendChild(summary)
    for (let i = 0; i < text.length - 1; i++) {
        const p = document.createElement('p')
        p.innerText = `${text[i]?.item} ${text[i]?.characteristic} - ${text[i]?.accuracy}%`
        details.append(p)
    }
    div.appendChild(image)
    div.appendChild(details)
    contentImage.appendChild(div)
    const dt = [file, text]
    data.push(dt)
    localStorage.setItem('images', JSON.stringify(data))
}

// Esta função padroniza a mensagem e a imagem a serem exibidas quando uma imagem proibida é detectada.
const unavailableImage = async () => {
    const div = document.createElement('div')
    const image = document.createElement('img')
    image.src = 'style/image.png'
    const p = document.createElement('p')
    p.innerText = 'Conteúdo não aceito pela nossa comunidade...'
    div.appendChild(image)
    div.appendChild(p)
    contentImage.appendChild(div)
    contentImage.scrollTo = contentImage.scrollHeight
}

// Esta função cria o prompt, trata a imagem e conecta-se ao AI Studio para receber o retorno.
document.getElementById('input-image-gemini').addEventListener('change', async function run() {
    const file = document.querySelector("input[type=file]");
    if (!file.files[0])
        return
    try {
        loading.classList.remove('hidden')
        article.classList.add('hidden')
        // For text-and-images input (multimodal), use the gemini-pro-vision model
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

        const prompt = "Identify the most relevant objects, people, groups, animals, artistic styles, etc., in the image.Rules:When scenes of sexual content, crimes, drugs, harassment, assault, discrimination, weapons, and other illegal or inappropriate items are detected in the image, insert a key 'prohibited' with a value of true in the last index of the same object as 'description'.Identify at least 1 item and at most 9 items. It is not necessary to identify 9 items, only if there are important items for the image.Return a text in array format with the objects found.Divide the image into 9 pieces to facilitate locating the items, as if it were a tic-tac-toe grid, and number the positions from 0 to 8.The last index of the array will always be an object with the key 'description', and the value of this key will be a description of the image.Identify the position, the item, the item's characteristic, and the identification accuracy in percentage.Always return only one array in portuguese.";

        const imagePart = await Promise.all(
            [...file.files].map(fileToGenerativePart)
        );

        const result = await model.generateContent([prompt, ...imagePart]);
        const response = await result.response;
        const text = response.text();
        if (text.includes('[]'))
            unavailableImage()
        else
            addItemView(JSON.parse(text), imagePart)
    } catch (error) {
        console.log(error)
        unavailableImage()
    } finally {
        file.value = null
        article.classList.remove('hidden')
        loading.classList.add('hidden')
    }

});

//Esta função verifica se já existem pesquisas armazenadas no localStorage do navegador.
document.addEventListener("DOMContentLoaded", function () {
    data = JSON.parse(localStorage.getItem('images')) || []
    if (data?.length > 0)
        insertDataView()
    return
});

// Esta função exibe as pesquisas que estavam salvas no localStorage do navegador.
const insertDataView = () => {
    data.forEach((element) => {
        const file = element[0]
        const text = element[1]
        const div = document.createElement('div')
        const image = document.createElement('img')
        image.src = `data:${file[0]?.inlineData?.mimeType};base64,` + file[0]?.inlineData?.data
        const details = document.createElement('details')
        const summary = document.createElement('summary')
        summary.innerText = text[text.length - 1]?.description
        details.appendChild(summary)
        for (let i = 0; i < text.length - 1; i++) {
            const p = document.createElement('p')
            p.innerText = `${text[i]?.item} ${text[i]?.characteristic} - ${text[i]?.accuracy}%`
            details.append(p)
        }
        div.appendChild(image)
        div.appendChild(details)
        contentImage.appendChild(div)
    })
}

