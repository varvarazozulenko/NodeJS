export interface Product {
    id: number
    name: string
    price: number
    category: 'electronics' | 'clothing' | 'food' | 'other'
    stock: number
    description?: string
    imageUrl?: string
    createdAt: string
}

export const products: Product[] = [
    {
        id: 1,
        name: "Клавиатура K2",
        price: 8500,
        category: "electronics",
        stock: 12,
        description: "Беспроводная клавиатура",
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        name: "Худи",
        price: 3200,
        category: "clothing",
        stock: 25,
        description: "Хлопковое худи",
        createdAt: new Date().toISOString()
    }
]