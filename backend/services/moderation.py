import httpx
from typing import Optional


NSFW_KEYWORDS = [
    "порнография", "эротика", "секс", "интим", "ню", "nude",
    "xxx", "porn", "erotica", "sex", "nude",
]

DRUG_KEYWORDS = [
    "наркотик", "наркотики", "гашиш", "марихуана", "кокаин", "героин",
    "amphetamine", "mdma", "extasy", "trap", "дилер", "buy drugs",
    "купить наркотики", "продажа наркотиков",
]

WEAPONS_KEYWORDS = [
    "оружие", "пистолет", "ружье", "нож", "оружие на продажу",
    "weapon", "gun", "sell weapon",
]

ANIMAL_KEYWORDS = [
    "собака", "кошка", "кот", "пес", "щенок", "котёнок", "котенок",
    "хомяк", "хомячок", "попугай", "рыбка", "черепаха", "кролик",
    "horse", "horse", "dog", "cat", "puppy", "kitten", "hamster",
    "parrot", "fish", "turtle", "rabbit", "лошадь", "корова", "свинья",
    "птица", "snake", "змея", "ящерица", "iguana", "chinchilla",
    "chipmunk", "ferret", "fox", "лиса", "едвежонок", "медведь",
    "панда", "kangaroo", "кенгуру",
]

NSFW_API_URL = "https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection"
ANIMAL_API_URL = "https://api-inference.huggingface.co/models/google/vit-base-patch16-224"


async def check_image_nsfw(image_bytes: bytes) -> dict:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                NSFW_API_URL,
                content=image_bytes,
                headers={"Content-Type": "application/octet-stream"}
            )
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    top_label = result[0].get("label", "").lower()
                    score = result[0].get("score", 0)
                    if "nsfw" in top_label and score > 0.7:
                        return {"approved": False, "reason": "Изображение содержит NSFW контент", "score": score}
            return {"approved": True}
    except Exception as e:
        print(f"NSFW check error: {e}")
        return {"approved": True, "warning": "Не удалось проверить изображение"}


async def check_image_animal(image_bytes: bytes) -> dict:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ANIMAL_API_URL,
                content=image_bytes,
                headers={"Content-Type": "application/octet-stream"}
            )
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    labels = [r.get("label", "").lower() for r in result]
                    animal_found = any(
                        any(animal in label for animal in ["dog", "cat", "bird", "animal", "pet", "horse", "rabbit"])
                        for label in labels
                    )
                    if not animal_found:
                        return {"approved": False, "reason": "На изображении не обнаружено животное"}
            return {"approved": True}
    except Exception as e:
        print(f"Animal check error: {e}")
        return {"approved": True, "warning": "Не удалось проверить изображение на наличие животного"}


def check_text_content(text: str) -> dict:
    text_lower = text.lower()

    for keyword in NSFW_KEYWORDS:
        if keyword in text_lower:
            return {"approved": False, "reason": f"Текст содержит запрещенный контент: {keyword}"}

    for keyword in DRUG_KEYWORDS:
        if keyword in text_lower:
            return {"approved": False, "reason": f"Текст содержит информацию о наркотиках: {keyword}"}

    for keyword in WEAPONS_KEYWORDS:
        if keyword in text_lower:
            return {"approved": False, "reason": f"Текст содержит информацию об оружии: {keyword}"}

    return {"approved": True}


def check_animal_context(text: str) -> dict:
    text_lower = text.lower()
    has_animal_keyword = any(animal in text_lower for animal in ANIMAL_KEYWORDS)
    
    if not has_animal_keyword and len(text) > 50:
        return {"approved": False, "reason": "Описание не содержит информации о животных"}
    
    return {"approved": True}


async def moderate_pet_content(
    image_bytes: Optional[bytes],
    text: str,
    name: str = "",
    species: str = ""
) -> dict:
    results = {
        "approved": True,
        "reasons": [],
        "details": {}
    }

    text_check = check_text_content(text + " " + name + " " + species)
    if not text_check["approved"]:
        results["approved"] = False
        results["reasons"].append(text_check["reason"])

    # Для неизвестных животных пропускаем проверку на упоминание конкретного вида
    if species.lower() != "неизвестно":
        animal_check = check_animal_context(text + " " + species)
        if not animal_check["approved"]:
            results["approved"] = False
            results["reasons"].append(animal_check["reason"])

    if image_bytes:
        nsfw_check = await check_image_nsfw(image_bytes)
        if not nsfw_check["approved"]:
            results["approved"] = False
            results["reasons"].append(nsfw_check["reason"])
        results["details"]["nsfw"] = nsfw_check

        animal_img_check = await check_image_animal(image_bytes)
        if not animal_img_check["approved"]:
            results["approved"] = False
            results["reasons"].append(animal_img_check["reason"])
        results["details"]["animal_detection"] = animal_img_check

    if results["approved"]:
        results["reason"] = None
    else:
        results["reason"] = "; ".join(results["reasons"])

    return results
