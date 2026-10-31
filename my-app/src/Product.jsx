import { useParams } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "./CartContext";
import { useNavigate } from "react-router-dom";

export default function Product() {
    const { id } = useParams();
    const { addToCart } = useContext(CartContext);
    const navigate = useNavigate();

    function handleAdd() {
        addToCart({
            id: parseInt(id),
            name: `Товар ${id}`,
            price: id === '1' ? 1000 : 2000
        });
        navigate("/cart");
    }

    return (
        <div>
            <h1>Товар {id}</h1>
            <button onClick={handleAdd}>Добавить в корзину</button>
        </div>
    );
}