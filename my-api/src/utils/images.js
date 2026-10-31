const SERVICE_IMAGES = {
    'Аренда яхты "Мечта"': '/images/ya1.jpg',
    'Аренда яхты "Звезда"': '/images/rich.jpg',
    'Аренда яхты "Бриз"': '/images/ya2.jpg',
    'Аренда яхты "Океан"': '/images/rich.jpg',
    'Катер "Ветер"': '/images/cat.jpg',
    'Катер "Волна"': '/images/ya.jpg',
    'Катер "Шторм"': '/images/cat.jpg',
    'Гидроцикл "Стрела"': '/images/ya.jpg',
    'Гидроцикл "Форсаж"': '/images/cat.jpg',
    'Гидроцикл "Тайфун"': '/images/ya.jpg',
};

const CATEGORY_IMAGES = {
    'Яхты': '/images/ya1.jpg',
    'Катера': '/images/cat.jpg',
    'Гидроциклы': '/images/ya.jpg',
};

const DEFAULT_IMAGE = '/images/ya2.jpg';

export function getServiceImage(serviceName, categoryName) {
    return SERVICE_IMAGES[serviceName] || CATEGORY_IMAGES[categoryName] || DEFAULT_IMAGE;
}
