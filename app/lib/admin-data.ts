export type AccountStatus = "Active" | "Suspended" | "Banned"

export type AdminUser = {
  id: string
  name: string
  email: string
  initials: string
  /** Absolute or relative profile image URL */
  image?: string | null
  role: "Customer" | "Technician" | "Admin"
  joined: string
  bookings: number
  status: AccountStatus
}

export type BookingStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "DECLINED"
  | "PAID"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

export type CategoryIcon = string

export type AdminCategory = {
  id: string
  name: string
  slug: string
  /** API stores emoji icons, e.g. 🔧 */
  icon: string
  jobs: number
  services: number
  /** Maps to API `isVisible` */
  active: boolean
  createdAt?: string
  sortOrder?: number
  technicians?: number
}

/** Emoji icons for home-service categories — searchable by label/keywords. */
/** Emoji icons for home-service categories — searchable by label/keywords. */
export const CATEGORY_ICON_OPTIONS: {
  key: string
  emoji: string
  label: string
  keywords: string[]
}[] = [
  { key: "wrench", emoji: "🔧", label: "Wrench", keywords: ["plumbing", "pipe", "repair", "fix", "tools"] },
  { key: "tap", emoji: "🚰", label: "Tap", keywords: ["plumbing", "water", "faucet", "sink"] },
  { key: "toilet", emoji: "🚽", label: "Toilet", keywords: ["plumbing", "bathroom", "sanitary"] },
  { key: "shower", emoji: "🚿", label: "Shower", keywords: ["plumbing", "bathroom", "bath"] },
  { key: "bath", emoji: "🛁", label: "Bath", keywords: ["plumbing", "bathroom", "tub"] },
  { key: "droplet", emoji: "💧", label: "Water", keywords: ["plumbing", "leak", "water", "tank"] },
  { key: "bolt", emoji: "⚡", label: "Bolt", keywords: ["electrical", "electric", "power", "wiring"] },
  { key: "bulb", emoji: "💡", label: "Bulb", keywords: ["electrical", "lighting", "lamp", "light"] },
  { key: "plug", emoji: "🔌", label: "Plug", keywords: ["electrical", "appliance", "socket", "outlet"] },
  { key: "battery", emoji: "🔋", label: "Battery", keywords: ["electrical", "power", "ups", "inverter"] },
  { key: "flashlight", emoji: "🔦", label: "Flashlight", keywords: ["electrical", "light", "torch"] },
  { key: "snow", emoji: "❄️", label: "Snow", keywords: ["ac", "cooling", "air", "hvac", "freezer"] },
  { key: "wind", emoji: "🌬️", label: "Fan air", keywords: ["ac", "cooling", "fan", "ventilation"] },
  { key: "thermo", emoji: "🌡️", label: "Temperature", keywords: ["ac", "cooling", "heating", "hvac"] },
  { key: "cyclone", emoji: "🌀", label: "Cyclone", keywords: ["ac", "cooling", "fan", "air"] },
  { key: "broom", emoji: "🧹", label: "Broom", keywords: ["cleaning", "clean", "sweep", "maid"] },
  { key: "sponge", emoji: "🧽", label: "Sponge", keywords: ["cleaning", "kitchen", "wash"] },
  { key: "soap", emoji: "🧴", label: "Soap", keywords: ["cleaning", "sanitize", "disinfectant"] },
  { key: "sparkle", emoji: "✨", label: "Sparkle", keywords: ["cleaning", "deep clean", "polish"] },
  { key: "basket", emoji: "🧺", label: "Laundry", keywords: ["cleaning", "laundry", "wash", "clothes"] },
  { key: "bubbles", emoji: "🫧", label: "Bubbles", keywords: ["cleaning", "wash", "soap"] },
  { key: "palette", emoji: "🎨", label: "Palette", keywords: ["painting", "paint", "art", "color"] },
  { key: "brush", emoji: "🖌️", label: "Brush", keywords: ["painting", "paint", "wall"] },
  { key: "crayon", emoji: "🖍️", label: "Crayon", keywords: ["painting", "paint", "draw"] },
  { key: "frame", emoji: "🖼️", label: "Frame", keywords: ["painting", "decor", "wall"] },
  { key: "saw", emoji: "🪚", label: "Saw", keywords: ["carpentry", "wood", "furniture", "cut"] },
  { key: "wood", emoji: "🪵", label: "Wood", keywords: ["carpentry", "timber", "furniture"] },
  { key: "hammer", emoji: "🔨", label: "Hammer", keywords: ["carpentry", "handyman", "nail", "tools"] },
  { key: "axe", emoji: "🪓", label: "Axe", keywords: ["carpentry", "wood", "cutting"] },
  { key: "door", emoji: "🚪", label: "Door", keywords: ["carpentry", "door", "install", "hinge"] },
  { key: "chair", emoji: "🪑", label: "Chair", keywords: ["carpentry", "furniture", "assembly"] },
  { key: "sofa", emoji: "🛋️", label: "Sofa", keywords: ["furniture", "upholstery", "home"] },
  { key: "bed", emoji: "🛏️", label: "Bed", keywords: ["furniture", "bedroom", "assembly"] },
  { key: "tv", emoji: "📺", label: "TV", keywords: ["appliance", "electronics", "television"] },
  { key: "radio", emoji: "📻", label: "Radio", keywords: ["appliance", "electronics"] },
  { key: "fridge", emoji: "🧊", label: "Fridge", keywords: ["appliance", "refrigerator", "freezer"] },
  { key: "microwave", emoji: "🍲", label: "Kitchen", keywords: ["appliance", "kitchen", "cooking"] },
  { key: "cooking", emoji: "🍳", label: "Cooking", keywords: ["appliance", "kitchen", "stove", "oven"] },
  { key: "bug", emoji: "🐛", label: "Bug", keywords: ["pest", "insect", "control"] },
  { key: "ant", emoji: "🐜", label: "Ant", keywords: ["pest", "insect", "control"] },
  { key: "cockroach", emoji: "🪳", label: "Cockroach", keywords: ["pest", "insect", "control"] },
  { key: "spider", emoji: "🕷️", label: "Spider", keywords: ["pest", "insect", "control"] },
  { key: "rat", emoji: "🐀", label: "Rat", keywords: ["pest", "rodent", "mice", "control"] },
  { key: "mosquito", emoji: "🦟", label: "Mosquito", keywords: ["pest", "insect", "fogging"] },
  { key: "box", emoji: "📦", label: "Box", keywords: ["moving", "pack", "delivery", "storage"] },
  { key: "truck", emoji: "🚚", label: "Truck", keywords: ["moving", "transport", "delivery"] },
  { key: "luggage", emoji: "🧳", label: "Luggage", keywords: ["moving", "relocate", "pack"] },
  { key: "home", emoji: "🏠", label: "Home", keywords: ["home", "house", "residential"] },
  { key: "house", emoji: "🏡", label: "House", keywords: ["home", "garden", "residential"] },
  { key: "key", emoji: "🔑", label: "Key", keywords: ["locksmith", "lock", "key", "security"] },
  { key: "lock", emoji: "🔒", label: "Lock", keywords: ["locksmith", "security", "door"] },
  { key: "shield", emoji: "🛡️", label: "Shield", keywords: ["safety", "security", "protection"] },
  { key: "alarm", emoji: "🚨", label: "Alarm", keywords: ["security", "cctv", "alarm", "safety"] },
  { key: "extinguisher", emoji: "🧯", label: "Extinguisher", keywords: ["safety", "fire", "emergency"] },
  { key: "tools", emoji: "🛠️", label: "Tools", keywords: ["handyman", "repair", "maintenance", "tools"] },
  { key: "toolbox", emoji: "🧰", label: "Toolbox", keywords: ["handyman", "tools", "repair"] },
  { key: "screwdriver", emoji: "🪛", label: "Screwdriver", keywords: ["handyman", "repair", "assembly"] },
  { key: "nut", emoji: "🔩", label: "Bolt nut", keywords: ["handyman", "metal", "repair"] },
  { key: "gear", emoji: "⚙️", label: "Gear", keywords: ["mechanic", "machine", "repair"] },
  { key: "magnet", emoji: "🧲", label: "Magnet", keywords: ["repair", "tools", "metal"] },
  { key: "plant", emoji: "🌱", label: "Plant", keywords: ["garden", "gardening", "lawn", "plant"] },
  { key: "herb", emoji: "🌿", label: "Herb", keywords: ["garden", "landscaping", "plants"] },
  { key: "tree", emoji: "🌳", label: "Tree", keywords: ["garden", "tree", "outdoor", "cutting"] },
  { key: "potted", emoji: "🪴", label: "Potted", keywords: ["garden", "plant", "indoor"] },
  { key: "scissors", emoji: "✂️", label: "Scissors", keywords: ["garden", "tailoring", "cut"] },
  { key: "sun", emoji: "☀️", label: "Sun", keywords: ["solar", "energy", "panel", "power"] },
  { key: "sunny", emoji: "🔆", label: "Bright", keywords: ["solar", "light", "energy"] },
  { key: "ladder", emoji: "🪜", label: "Ladder", keywords: ["roofing", "height", "paint", "repair"] },
  { key: "brick", emoji: "🧱", label: "Brick", keywords: ["masonry", "construction", "wall", "flooring"] },
  { key: "window", emoji: "🪟", label: "Window", keywords: ["glass", "window", "glazing"] },
  { key: "camera", emoji: "📷", label: "Camera", keywords: ["cctv", "camera", "security", "photo"] },
  { key: "video", emoji: "📹", label: "Video", keywords: ["cctv", "surveillance", "security"] },
  { key: "satellite", emoji: "📡", label: "Satellite", keywords: ["internet", "network", "dish", "wifi"] },
  { key: "laptop", emoji: "💻", label: "Laptop", keywords: ["it", "computer", "tech", "repair"] },
  { key: "phone", emoji: "📱", label: "Phone", keywords: ["mobile", "phone", "repair"] },
  { key: "car", emoji: "🚗", label: "Car", keywords: ["car", "auto", "wash", "vehicle"] },
  { key: "fire", emoji: "🔥", label: "Fire", keywords: ["gas", "stove", "welding", "heating"] },
  { key: "clamp", emoji: "🗜️", label: "Clamp", keywords: ["carpentry", "tools", "workshop"] },
  { key: "sweat", emoji: "💦", label: "Splash", keywords: ["plumbing", "leak", "water", "flood"] },
  { key: "ocean", emoji: "🌊", label: "Wave", keywords: ["plumbing", "water", "drain"] },
  { key: "potable", emoji: "🧉", label: "Filter drink", keywords: ["water", "filter", "purifier"] },
  { key: "bucket", emoji: "🪣", label: "Bucket", keywords: ["plumbing", "cleaning", "paint", "water"] },
  { key: "candle", emoji: "🕯️", label: "Candle", keywords: ["electrical", "light", "power cut"] },
  { key: "danger", emoji: "☠️", label: "Hazard", keywords: ["electrical", "power", "danger", "safety"] },
  { key: "diode", emoji: "💠", label: "Circuit", keywords: ["electrical", "electronics", "chip"] },
  { key: "controls", emoji: "🎛️", label: "Controls", keywords: ["electrical", "switchboard", "panel"] },
  { key: "cloud", emoji: "☁️", label: "Cloud", keywords: ["ac", "cooling", "air"] },
  { key: "fog", emoji: "🌫️", label: "Fog", keywords: ["ac", "humidifier", "ventilation"] },
  { key: "hot", emoji: "🥵", label: "Hot", keywords: ["ac", "cooling", "heat", "weather"] },
  { key: "cold", emoji: "🥶", label: "Cold", keywords: ["ac", "cooling", "freezer"] },
  { key: "heater", emoji: "♨️", label: "Heater", keywords: ["heating", "geyser", "boiler", "hot water"] },
  { key: "soapbar", emoji: "🧼", label: "Soap bar", keywords: ["cleaning", "hygiene", "wash"] },
  { key: "tissue", emoji: "🧻", label: "Tissue", keywords: ["cleaning", "bathroom", "hygiene"] },
  { key: "recycle", emoji: "♻️", label: "Recycle", keywords: ["cleaning", "waste", "disposal"] },
  { key: "trash", emoji: "🗑️", label: "Trash", keywords: ["cleaning", "waste", "garbage"] },
  { key: "dustpan", emoji: "🗑️", label: "Dustbin", keywords: ["cleaning", "waste", "dust"] },
  { key: "vacuum", emoji: "🌀", label: "Vacuum", keywords: ["cleaning", "vacuum", "carpet"] },
  { key: "glove", emoji: "🧤", label: "Gloves", keywords: ["cleaning", "safety", "kitchen"] },
  { key: "mask", emoji: "😷", label: "Mask", keywords: ["cleaning", "sanitize", "safety"] },
  { key: "paintcan", emoji: "🫙", label: "Paint can", keywords: ["painting", "paint", "can"] },
  { key: "nailpolish", emoji: "💅", label: "Polish", keywords: ["painting", "polish", "finish"] },
  { key: "ribbon", emoji: "🎀", label: "Decor", keywords: ["decor", "interior", "design"] },
  { key: "lamp", emoji: "💡", label: "Desk lamp", keywords: ["lighting", "decor", "electrical"] },
  { key: "floorlamp", emoji: "🪔", label: "Diya", keywords: ["lighting", "decor", "electrical"] },
  { key: "pick", emoji: "⛏️", label: "Pickaxe", keywords: ["construction", "masonry", "dig"] },
  { key: "construction", emoji: "🚧", label: "Construction", keywords: ["construction", "building", "road"] },
  { key: "helmet", emoji: "⛑️", label: "Helmet", keywords: ["construction", "safety", "worker"] },
  { key: "hardhat", emoji: "👷", label: "Worker", keywords: ["construction", "handyman", "labour"] },
  { key: "hook", emoji: "🪝", label: "Hook", keywords: ["carpentry", "hanging", "install"] },
  { key: "chains", emoji: "⛓️", label: "Chain", keywords: ["metal", "repair", "security"] },
  { key: "ruler", emoji: "📐", label: "Ruler", keywords: ["carpentry", "measure", "design"] },
  { key: "straight", emoji: "📏", label: "Measure", keywords: ["carpentry", "measure", "flooring"] },
  { key: "pushpin", emoji: "📌", label: "Pin", keywords: ["carpentry", "nail", "hang"] },
  { key: "washer", emoji: "🫧", label: "Washer", keywords: ["appliance", "washing machine", "laundry"] },
  { key: "fan", emoji: "🪭", label: "Hand fan", keywords: ["appliance", "fan", "cooling"] },
  { key: "speaker", emoji: "🔊", label: "Speaker", keywords: ["appliance", "electronics", "audio"] },
  { key: "headphones", emoji: "🎧", label: "Headphones", keywords: ["electronics", "audio", "repair"] },
  { key: "printer", emoji: "🖨️", label: "Printer", keywords: ["appliance", "office", "electronics"] },
  { key: "fax", emoji: "📠", label: "Fax", keywords: ["appliance", "office", "electronics"] },
  { key: "keyboard", emoji: "⌨️", label: "Keyboard", keywords: ["it", "computer", "repair"] },
  { key: "mouse", emoji: "🖱️", label: "Mouse", keywords: ["it", "computer", "repair"] },
  { key: "cd", emoji: "💿", label: "Disc", keywords: ["electronics", "media", "repair"] },
  { key: "game", emoji: "🎮", label: "Console", keywords: ["electronics", "gaming", "repair"] },
  { key: "watch", emoji: "⌚", label: "Watch", keywords: ["electronics", "repair", "gadget"] },
  { key: "clock", emoji: "⏰", label: "Clock", keywords: ["electronics", "repair", "home"] },
  { key: "pot", emoji: "🍲", label: "Pot", keywords: ["kitchen", "cooking", "appliance"] },
  { key: "bowl", emoji: "🥣", label: "Bowl", keywords: ["kitchen", "appliance"] },
  { key: "knife", emoji: "🔪", label: "Knife", keywords: ["kitchen", "sharpen", "cutlery"] },
  { key: "fork", emoji: "🍴", label: "Utensils", keywords: ["kitchen", "dining"] },
  { key: "coffee", emoji: "☕", label: "Coffee", keywords: ["kitchen", "appliance", "machine"] },
  { key: "teapot", emoji: "🫖", label: "Teapot", keywords: ["kitchen", "appliance"] },
  { key: "blender", emoji: "🥛", label: "Blender", keywords: ["kitchen", "appliance", "mixer"] },
  { key: "bread", emoji: "🍞", label: "Toaster", keywords: ["kitchen", "appliance", "bakery"] },
  { key: "bee", emoji: "🐝", label: "Bee", keywords: ["pest", "hive", "insect"] },
  { key: "fly", emoji: "🪰", label: "Fly", keywords: ["pest", "insect", "control"] },
  { key: "worm", emoji: "🪱", label: "Worm", keywords: ["pest", "garden", "soil"] },
  { key: "scorpion", emoji: "🦂", label: "Scorpion", keywords: ["pest", "insect", "control"] },
  { key: "snake", emoji: "🐍", label: "Snake", keywords: ["pest", "wildlife", "control"] },
  { key: "bat", emoji: "🦇", label: "Bat", keywords: ["pest", "wildlife", "attic"] },
  { key: "bird", emoji: "🐦", label: "Bird", keywords: ["pest", "netting", "balcony"] },
  { key: "package", emoji: "📫", label: "Mailbox", keywords: ["moving", "delivery", "courier"] },
  { key: "cart", emoji: "🛒", label: "Cart", keywords: ["moving", "shopping", "delivery"] },
  { key: "ship", emoji: "🚢", label: "Ship", keywords: ["moving", "freight", "delivery"] },
  { key: "dolly", emoji: "🛒", label: "Trolley", keywords: ["moving", "warehouse"] },
  { key: "van", emoji: "🚐", label: "Van", keywords: ["moving", "transport", "delivery"] },
  { key: "artic", emoji: "🚛", label: "Lorry", keywords: ["moving", "transport", "heavy"] },
  { key: "crane", emoji: "🏗️", label: "Crane", keywords: ["moving", "construction", "lift"] },
  { key: "anchor", emoji: "⚓", label: "Anchor", keywords: ["moving", "heavy", "lift"] },
  { key: "apartment", emoji: "🏢", label: "Apartment", keywords: ["home", "building", "office"] },
  { key: "office", emoji: "🏬", label: "Office", keywords: ["office", "commercial", "cleaning"] },
  { key: "factory", emoji: "🏭", label: "Factory", keywords: ["industrial", "commercial"] },
  { key: "tent", emoji: "⛺", label: "Tent", keywords: ["outdoor", "event", "setup"] },
  { key: "toilet2", emoji: "🚻", label: "Restroom", keywords: ["plumbing", "bathroom", "cleaning"] },
  { key: "hotel", emoji: "🏨", label: "Hotel", keywords: ["commercial", "cleaning", "hospitality"] },
  { key: "unlock", emoji: "🔓", label: "Unlock", keywords: ["locksmith", "security", "key"] },
  { key: "oldkey", emoji: "🗝️", label: "Old key", keywords: ["locksmith", "antique", "door"] },
  { key: "bell", emoji: "🔔", label: "Bell", keywords: ["security", "doorbell", "alarm"] },
  { key: "eye", emoji: "👁️", label: "Eye", keywords: ["cctv", "security", "watch"] },
  { key: "detective", emoji: "🕵️", label: "Detective", keywords: ["security", "investigation"] },
  { key: "police", emoji: "👮", label: "Police", keywords: ["security", "safety"] },
  { key: "control", emoji: "🛂", label: "Access", keywords: ["security", "access", "gate"] },
  { key: "flower", emoji: "🌸", label: "Flower", keywords: ["garden", "florist", "landscape"] },
  { key: "rose", emoji: "🌹", label: "Rose", keywords: ["garden", "florist"] },
  { key: "tulip", emoji: "🌷", label: "Tulip", keywords: ["garden", "florist"] },
  { key: "cactus", emoji: "🌵", label: "Cactus", keywords: ["garden", "plant", "indoor"] },
  { key: "palm", emoji: "🌴", label: "Palm", keywords: ["garden", "outdoor", "tree"] },
  { key: "leaf", emoji: "🍃", label: "Leaf", keywords: ["garden", "cleaning", "outdoor"] },
  { key: "seedling", emoji: "🌾", label: "Grain", keywords: ["garden", "farm", "lawn"] },
  { key: "mushroom", emoji: "🍄", label: "Mushroom", keywords: ["garden", "pest", "damp"] },
  { key: "bugnet", emoji: "🕸️", label: "Web net", keywords: ["garden", "pest", "bird", "net"] },
  { key: "sunflower", emoji: "🌻", label: "Sunflower", keywords: ["garden", "florist"] },
  { key: "sunrise", emoji: "🌅", label: "Sunrise", keywords: ["solar", "energy", "morning"] },
  { key: "sunset", emoji: "🌇", label: "Sunset", keywords: ["solar", "energy"] },
  { key: "star", emoji: "⭐", label: "Star", keywords: ["solar", "energy", "premium"] },
  { key: "zap", emoji: "💥", label: "Zap", keywords: ["electrical", "power", "surge"] },
  { key: "atom", emoji: "⚛️", label: "Atom", keywords: ["energy", "science", "power"] },
  { key: "fuel", emoji: "⛽", label: "Fuel", keywords: ["generator", "gas", "energy"] },
  { key: "oil", emoji: "🛢️", label: "Oil", keywords: ["generator", "mechanic", "service"] },
  { key: "tile", emoji: "🧩", label: "Tile", keywords: ["flooring", "tile", "mosaic"] },
  { key: "mirror", emoji: "🪞", label: "Mirror", keywords: ["glass", "bathroom", "install"] },
  { key: "gem", emoji: "💎", label: "Gem", keywords: ["glass", "polish", "premium"] },
  { key: "rock", emoji: "🪨", label: "Rock", keywords: ["masonry", "stone", "flooring"] },
  { key: "scissors2", emoji: "💇", label: "Haircut", keywords: ["salon", "beauty", "hair"] },
  { key: "barber", emoji: "💈", label: "Barber", keywords: ["salon", "beauty", "hair"] },
  { key: "makeup", emoji: "💄", label: "Makeup", keywords: ["beauty", "salon", "bridal"] },
  { key: "spa", emoji: "💆", label: "Spa", keywords: ["beauty", "massage", "spa"] },
  { key: "lipstick", emoji: "💋", label: "Beauty", keywords: ["beauty", "salon", "bridal"] },
  { key: "pill", emoji: "💊", label: "Pill", keywords: ["health", "care", "nurse"] },
  { key: "syringe", emoji: "💉", label: "Syringe", keywords: ["health", "care", "nurse"] },
  { key: "stethoscope", emoji: "🩺", label: "Stethoscope", keywords: ["health", "care", "doctor"] },
  { key: "bandage", emoji: "🩹", label: "Bandage", keywords: ["health", "first aid"] },
  { key: "wheelchair", emoji: "♿", label: "Accessibility", keywords: ["health", "care", "access"] },
  { key: "taxi", emoji: "🚕", label: "Taxi", keywords: ["car", "auto", "transport"] },
  { key: "bus", emoji: "🚌", label: "Bus", keywords: ["vehicle", "transport"] },
  { key: "bike", emoji: "🚲", label: "Bike", keywords: ["bike", "cycle", "repair"] },
  { key: "motorbike", emoji: "🏍️", label: "Motorbike", keywords: ["bike", "motorcycle", "repair"] },
  { key: "scooter", emoji: "🛵", label: "Scooter", keywords: ["bike", "scooter", "repair"] },
  { key: "tire", emoji: "🛞", label: "Tire", keywords: ["car", "auto", "puncture", "tyre"] },
  { key: "patrol", emoji: "🚓", label: "Patrol", keywords: ["security", "car", "auto"] },
  { key: "wifi", emoji: "📶", label: "Signal", keywords: ["internet", "wifi", "network"] },
  { key: "desktop", emoji: "🖥️", label: "Desktop", keywords: ["it", "computer", "repair"] },
  { key: "router", emoji: "📟", label: "Pager", keywords: ["internet", "router", "network"] },
  { key: "usb", emoji: "💾", label: "Storage", keywords: ["it", "computer", "backup"] },
  { key: "joystick", emoji: "🕹️", label: "Joystick", keywords: ["electronics", "gaming", "repair"] },
  { key: "email", emoji: "📧", label: "Email", keywords: ["it", "office", "support"] },
  { key: "welding", emoji: "🔥", label: "Welding", keywords: ["welding", "metal", "repair"] },
  { key: "bomb", emoji: "💣", label: "Detonate", keywords: ["demolition", "construction"] },
  { key: "crossed", emoji: "⚔️", label: "Blades", keywords: ["metal", "sharpen", "tools"] },
  { key: "dagger", emoji: "🗡️", label: "Blade", keywords: ["metal", "sharpen"] },
  { key: "sewing", emoji: "🧵", label: "Thread", keywords: ["tailoring", "sewing", "alteration"] },
  { key: "needle", emoji: "🪡", label: "Needle", keywords: ["tailoring", "sewing", "upholstery"] },
  { key: "yarn", emoji: "🧶", label: "Yarn", keywords: ["tailoring", "craft"] },
  { key: "shoe", emoji: "👞", label: "Shoe", keywords: ["cobbler", "shoe", "repair"] },
  { key: "sneaker", emoji: "👟", label: "Sneaker", keywords: ["cobbler", "shoe", "cleaning"] },
  { key: "umbrella", emoji: "☂️", label: "Umbrella", keywords: ["repair", "rain", "outdoor"] },
  { key: "briefcase", emoji: "💼", label: "Briefcase", keywords: ["office", "business", "service"] },
  { key: "clipboard", emoji: "📋", label: "Clipboard", keywords: ["inspection", "survey", "checklist"] },
  { key: "memo", emoji: "📝", label: "Memo", keywords: ["inspection", "quote", "note"] },
  { key: "handshake", emoji: "🤝", label: "Handshake", keywords: ["service", "contract", "deal"] },
  { key: "star2", emoji: "🌟", label: "Glow", keywords: ["premium", "featured", "service"] },
  { key: "trophy", emoji: "🏆", label: "Trophy", keywords: ["premium", "quality", "top"] },
  { key: "medal", emoji: "🏅", label: "Medal", keywords: ["premium", "verified", "quality"] },
  { key: "check", emoji: "✅", label: "Check", keywords: ["verified", "done", "complete"] },
  { key: "crossmark", emoji: "❌", label: "Cross", keywords: ["cancel", "unavailable"] },
  { key: "warning", emoji: "⚠️", label: "Warning", keywords: ["safety", "caution", "hazard"] },
  { key: "info", emoji: "ℹ️", label: "Info", keywords: ["support", "help", "info"] },
  { key: "question", emoji: "❓", label: "Question", keywords: ["support", "help", "faq"] },
  { key: "location", emoji: "📍", label: "Location", keywords: ["area", "map", "visit"] },
  { key: "compass", emoji: "🧭", label: "Compass", keywords: ["area", "navigation", "visit"] },
  { key: "map", emoji: "🗺️", label: "Map", keywords: ["area", "location", "service"] },
  { key: "calendar", emoji: "📅", label: "Calendar", keywords: ["booking", "schedule", "slot"] },
  { key: "timer", emoji: "⏱️", label: "Timer", keywords: ["booking", "duration", "quick"] },
  { key: "money", emoji: "💰", label: "Money", keywords: ["payment", "price", "affordable"] },
  { key: "card", emoji: "💳", label: "Card", keywords: ["payment", "online", "pay"] },
  { key: "receipt", emoji: "🧾", label: "Receipt", keywords: ["payment", "invoice", "billing"] },
  { key: "lizard", emoji: "🦎", label: "Lizard", keywords: ["pest", "wildlife", "control"] },
  { key: "fourleaf", emoji: "🍀", label: "Clover", keywords: ["garden", "lawn", "landscape"] },
  { key: "mountain", emoji: "⛰️", label: "Mountain", keywords: ["masonry", "stone", "outdoor"] },
  { key: "school", emoji: "🏫", label: "School", keywords: ["commercial", "institutional"] },
  { key: "hospital", emoji: "🏥", label: "Hospital", keywords: ["health", "care", "medical"] },
  { key: "boot", emoji: "👢", label: "Boot", keywords: ["cobbler", "shoe", "repair"] },
  { key: "dress", emoji: "👗", label: "Dress", keywords: ["tailoring", "alteration", "fashion"] },
  { key: "shirt", emoji: "👕", label: "Shirt", keywords: ["laundry", "ironing", "tailoring"] },
  { key: "gift", emoji: "🎁", label: "Gift", keywords: ["gift", "wrap", "special"] },
  { key: "balloon", emoji: "🎈", label: "Balloon", keywords: ["event", "party", "decor"] },
  { key: "party", emoji: "🎉", label: "Party", keywords: ["event", "party", "setup"] },
  { key: "mic", emoji: "🎤", label: "Mic", keywords: ["event", "av", "sound"] },
  { key: "film", emoji: "🎬", label: "Film", keywords: ["event", "photography", "video"] },
  { key: "photo", emoji: "📸", label: "Photo", keywords: ["photography", "camera", "event"] },
  { key: "pizza", emoji: "🍕", label: "Oven food", keywords: ["kitchen", "oven", "appliance"] },
  { key: "salt", emoji: "🧂", label: "Salt", keywords: ["kitchen", "appliance"] },
  { key: "shade", emoji: "⛱️", label: "Shade", keywords: ["outdoor", "awning", "install"] },
  { key: "night", emoji: "🌙", label: "Night light", keywords: ["electrical", "lighting", "night"] },
  { key: "lantern", emoji: "🏮", label: "Lantern", keywords: ["electrical", "light", "decor"] },
  { key: "rainbow", emoji: "🌈", label: "Rainbow", keywords: ["painting", "color", "decor"] },
  { key: "crystal", emoji: "🔮", label: "Crystal", keywords: ["decor", "glass", "lighting"] },
  { key: "jar", emoji: "🫙", label: "Jar", keywords: ["kitchen", "storage", "paint"] },
  { key: "balance", emoji: "⚖️", label: "Balance", keywords: ["legal", "inspection", "fair"] },
  { key: "abacus", emoji: "🧮", label: "Abacus", keywords: ["accounting", "office", "calc"] },
  { key: "telescope", emoji: "🔭", label: "Telescope", keywords: ["inspection", "survey"] },
  { key: "microscope", emoji: "🔬", label: "Microscope", keywords: ["lab", "inspection", "science"] },
  { key: "testtube", emoji: "🧪", label: "Lab", keywords: ["lab", "chemical", "cleaning"] },
  { key: "dna", emoji: "🧬", label: "DNA", keywords: ["lab", "science", "health"] },
  { key: "petri", emoji: "🧫", label: "Culture", keywords: ["lab", "pest", "science"] },
  { key: "bone", emoji: "🦴", label: "Bone", keywords: ["pet", "veterinary", "care"] },
  { key: "paw", emoji: "🐾", label: "Paw", keywords: ["pet", "veterinary", "grooming"] },
  { key: "dog", emoji: "🐶", label: "Dog", keywords: ["pet", "veterinary", "grooming"] },
  { key: "cat", emoji: "🐱", label: "Cat", keywords: ["pet", "veterinary", "grooming"] },
  { key: "fish", emoji: "🐟", label: "Fish", keywords: ["aquarium", "pet", "tank"] },
  { key: "aquarium", emoji: "🐠", label: "Aquarium", keywords: ["aquarium", "pet", "tank"] },
  { key: "crane2", emoji: "🦅", label: "Eagle", keywords: ["outdoor", "wildlife"] },
  { key: "nest", emoji: "🪺", label: "Nest", keywords: ["pest", "bird", "balcony"] },
  { key: "egg", emoji: "🥚", label: "Egg", keywords: ["kitchen", "appliance"] },
  { key: "cheese", emoji: "🧀", label: "Cheese", keywords: ["kitchen", "fridge", "appliance"] },
  { key: "icecream", emoji: "🍦", label: "Ice cream", keywords: ["appliance", "freezer", "kitchen"] },
  { key: "snowman", emoji: "⛄", label: "Snowman", keywords: ["ac", "cooling", "cold"] },
  { key: "parachute", emoji: "🪂", label: "Parachute", keywords: ["outdoor", "event", "safety"] },
  { key: "ringbuoy", emoji: "🛟", label: "Lifebuoy", keywords: ["safety", "pool", "rescue"] },
  { key: "pool", emoji: "🏊", label: "Pool", keywords: ["pool", "cleaning", "maintenance"] },
  { key: "soap2", emoji: "🧼", label: "Wash", keywords: ["cleaning", "laundry", "hygiene"] },
  { key: "toothbrush", emoji: "🪥", label: "Brush tooth", keywords: ["cleaning", "bathroom", "hygiene"] },
  { key: "comb", emoji: "💇‍♂️", label: "Groom", keywords: ["salon", "beauty", "hair"] },
  { key: "ring", emoji: "💍", label: "Ring", keywords: ["jewelry", "repair", "premium"] },
  { key: "crown", emoji: "👑", label: "Crown", keywords: ["premium", "vip", "service"] },
  { key: "genie", emoji: "🧞", label: "Genie", keywords: ["premium", "magic", "service"] },
  { key: "robot", emoji: "🤖", label: "Robot", keywords: ["automation", "tech", "appliance"] },
  { key: "alien", emoji: "👽", label: "Tech odd", keywords: ["tech", "gadget"] },
  { key: "satellite2", emoji: "🛰️", label: "Orbital", keywords: ["internet", "satellite", "network"] },
  { key: "rocket", emoji: "🚀", label: "Rocket", keywords: ["fast", "express", "delivery"] },
  { key: "flying", emoji: "🛸", label: "UFO", keywords: ["tech", "gadget"] },
  { key: "hourglass", emoji: "⏳", label: "Hourglass", keywords: ["booking", "wait", "schedule"] },
  { key: "stopwatch", emoji: "⏲️", label: "Stopwatch", keywords: ["booking", "duration", "quick"] },
  { key: "bellhop", emoji: "🛎️", label: "Service bell", keywords: ["hospitality", "service", "hotel"] },
  { key: "luggage2", emoji: "🛄", label: "Baggage", keywords: ["moving", "airport", "travel"] },
  { key: "customs", emoji: "🛃", label: "Customs", keywords: ["security", "inspection"] },
  { key: "elevator", emoji: "🛗", label: "Elevator", keywords: ["lift", "repair", "building"] },
  { key: "wheelchair2", emoji: "♿", label: "Access", keywords: ["accessibility", "ramp", "install"] },
  { key: "baby", emoji: "👶", label: "Baby", keywords: ["childcare", "nanny", "care"] },
  { key: "family", emoji: "👪", label: "Family", keywords: ["home", "care", "family"] },
  { key: "elder", emoji: "🧓", label: "Elder", keywords: ["eldercare", "care", "nurse"] },
  { key: "cook", emoji: "👨‍🍳", label: "Chef", keywords: ["cooking", "chef", "kitchen"] },
  { key: "mechanic", emoji: "🧑‍🔧", label: "Mechanic", keywords: ["auto", "repair", "mechanic"] },
  { key: "farmer", emoji: "🧑‍🌾", label: "Farmer", keywords: ["garden", "farm", "outdoor"] },
  { key: "scientist", emoji: "🧑‍🔬", label: "Scientist", keywords: ["lab", "inspection"] },
  { key: "technologist", emoji: "🧑‍💻", label: "Technologist", keywords: ["it", "computer", "tech"] },
  { key: "artist", emoji: "🧑‍🎨", label: "Artist", keywords: ["painting", "decor", "design"] },
  { key: "firefighter", emoji: "🧑‍🚒", label: "Firefighter", keywords: ["safety", "fire", "emergency"] },
  { key: "pilot", emoji: "🧑‍✈️", label: "Pilot", keywords: ["travel", "service"] },
  { key: "judge", emoji: "🧑‍⚖️", label: "Judge", keywords: ["legal", "inspection"] },
  { key: "guard", emoji: "💂", label: "Guard", keywords: ["security", "guard", "watch"] },
  { key: "ninja", emoji: "🥷", label: "Ninja", keywords: ["security", "stealth"] },
  { key: "wizard", emoji: "🧙", label: "Wizard", keywords: ["premium", "magic", "service"] },
  { key: "fairy", emoji: "🧚", label: "Fairy", keywords: ["cleaning", "sparkle", "home"] },
  { key: "merperson", emoji: "🧜", label: "Pool spirit", keywords: ["pool", "cleaning"] },
  { key: "superhero", emoji: "🦸", label: "Hero", keywords: ["premium", "fast", "service"] },
  { key: "villain", emoji: "🦹", label: "Trouble", keywords: ["pest", "problem"] },
  { key: "mage", emoji: "🪄", label: "Wand", keywords: ["premium", "magic", "service"] },
  { key: "pinata", emoji: "🪅", label: "Pinata", keywords: ["event", "party", "decor"] },
  { key: "confetti", emoji: "🎊", label: "Confetti", keywords: ["event", "party", "setup"] },
  { key: "tickets", emoji: "🎟️", label: "Tickets", keywords: ["event", "booking"] },
  { key: "circus", emoji: "🎪", label: "Circus", keywords: ["event", "tent", "setup"] },
  { key: "carousel", emoji: "🎠", label: "Carousel", keywords: ["event", "kids"] },
  { key: "ferris", emoji: "🎡", label: "Ferris", keywords: ["event", "outdoor"] },
  { key: "rollercoaster", emoji: "🎢", label: "Coaster", keywords: ["event", "outdoor"] },
  { key: "performing", emoji: "🎭", label: "Theatre", keywords: ["event", "av", "stage"] },
  { key: "artistpal", emoji: "🖌️", label: "Paint tool", keywords: ["painting", "art"] },
  { key: "accordion", emoji: "🪗", label: "Accordion", keywords: ["event", "music", "av"] },
  { key: "drum", emoji: "🥁", label: "Drum", keywords: ["event", "music", "av"] },
  { key: "guitar", emoji: "🎸", label: "Guitar", keywords: ["event", "music", "av"] },
  { key: "trumpet", emoji: "🎺", label: "Trumpet", keywords: ["event", "music", "av"] },
  { key: "violin", emoji: "🎻", label: "Violin", keywords: ["event", "music", "av"] },
  { key: "banjo", emoji: "🪕", label: "Banjo", keywords: ["event", "music"] },
  { key: "saxophone", emoji: "🎷", label: "Sax", keywords: ["event", "music", "av"] },
  { key: "postal", emoji: "🎵", label: "Music", keywords: ["event", "av", "sound"] },
  { key: "notes", emoji: "🎶", label: "Notes", keywords: ["event", "av", "sound"] },
  { key: "studio", emoji: "🎙️", label: "Studio mic", keywords: ["event", "av", "recording"] },
  { key: "levelslider", emoji: "🎚️", label: "Slider", keywords: ["av", "sound", "studio"] },
  { key: "knobs", emoji: "🎛️", label: "Knobs", keywords: ["av", "electrical", "controls"] },
  { key: "cinema", emoji: "🎦", label: "Cinema", keywords: ["av", "projector", "install"] },
  { key: "tv2", emoji: "📺", label: "Screen", keywords: ["appliance", "tv", "install"] },
  { key: "projector", emoji: "📽️", label: "Projector", keywords: ["av", "projector", "event"] },
  { key: "clapper", emoji: "🎬", label: "Clapper", keywords: ["photography", "video", "event"] },
  { key: "vhs", emoji: "📼", label: "VHS", keywords: ["electronics", "media", "repair"] },
  { key: "cameraflash", emoji: "📸", label: "Flash photo", keywords: ["photography", "camera"] },
  { key: "movie", emoji: "🎥", label: "Movie cam", keywords: ["photography", "video", "cctv"] },
  { key: "magnifier", emoji: "🔍", label: "Search", keywords: ["inspection", "survey", "find"] },
  { key: "magnifier2", emoji: "🔎", label: "Inspect", keywords: ["inspection", "survey"] },
  { key: "candle2", emoji: "🕯️", label: "Wax", keywords: ["decor", "lighting"] },
  { key: "lightbulb2", emoji: "💡", label: "Idea light", keywords: ["electrical", "lighting"] },
  { key: "flashlight2", emoji: "🔦", label: "Torch", keywords: ["electrical", "light", "inspect"] },
  { key: "redcircle", emoji: "🔴", label: "Red", keywords: ["painting", "color"] },
  { key: "orangecircle", emoji: "🟠", label: "Orange", keywords: ["painting", "color"] },
  { key: "yellowcircle", emoji: "🟡", label: "Yellow", keywords: ["painting", "color"] },
  { key: "greencircle", emoji: "🟢", label: "Green", keywords: ["painting", "color", "garden"] },
  { key: "bluecircle", emoji: "🔵", label: "Blue", keywords: ["painting", "color"] },
  { key: "purplecircle", emoji: "🟣", label: "Purple", keywords: ["painting", "color"] },
  { key: "browncircle", emoji: "🟤", label: "Brown", keywords: ["painting", "color", "wood"] },
  { key: "blackcircle", emoji: "⚫", label: "Black", keywords: ["painting", "color"] },
  { key: "whitecircle", emoji: "⚪", label: "White", keywords: ["painting", "color"] },
  { key: "square", emoji: "🟥", label: "Red tile", keywords: ["flooring", "tile", "paint"] },
  { key: "bluesquare", emoji: "🟦", label: "Blue tile", keywords: ["flooring", "tile"] },
  { key: "greensquare", emoji: "🟩", label: "Green tile", keywords: ["flooring", "tile", "garden"] },
  { key: "yellowsquare", emoji: "🟨", label: "Yellow tile", keywords: ["flooring", "tile"] },
  { key: "orangesquare", emoji: "🟧", label: "Orange tile", keywords: ["flooring", "tile"] },
  { key: "purplesquare", emoji: "🟪", label: "Purple tile", keywords: ["flooring", "tile"] },
  { key: "brownsquare", emoji: "🟫", label: "Brown tile", keywords: ["flooring", "wood"] },
  { key: "blacksquare", emoji: "⬛", label: "Black tile", keywords: ["flooring", "tile"] },
  { key: "whitesquare", emoji: "⬜", label: "White tile", keywords: ["flooring", "tile"] },
]

/** @deprecated use CATEGORY_ICON_OPTIONS */
export const CATEGORY_ICONS = CATEGORY_ICON_OPTIONS.map((o) => o.key)

export function filterCategoryIcons(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return CATEGORY_ICON_OPTIONS
  return CATEGORY_ICON_OPTIONS.filter((opt) => {
    const haystack = [opt.label, opt.key, ...opt.keywords].join(" ").toLowerCase()
    return (
      haystack.includes(q) ||
      q.split(/\s+/).some((part) => part.length > 1 && haystack.includes(part))
    )
  })
}

export const ADMIN_USERS_SEED: AdminUser[] = [
  { id: "u1", name: "Ayesha Siddika", email: "ayesha@mail.com", initials: "AS", role: "Customer", joined: "12 Mar 2026", bookings: 14, status: "Active" },
  { id: "u2", name: "Shamim Ahmed", email: "shamim@mail.com", initials: "SA", role: "Technician", joined: "04 Jan 2026", bookings: 512, status: "Active" },
  { id: "u3", name: "Rakib Hossain", email: "rakib@mail.com", initials: "RH", role: "Technician", joined: "22 Nov 2025", bookings: 640, status: "Active" },
  { id: "u4", name: "Mahmudul Hasan", email: "mahmud@mail.com", initials: "MH", role: "Customer", joined: "18 Jun 2026", bookings: 3, status: "Active" },
  { id: "u5", name: "Nasima Akter", email: "nasima@mail.com", initials: "NA", role: "Technician", joined: "09 Sep 2025", bookings: 780, status: "Active" },
  { id: "u6", name: "Imran Kabir", email: "imran@mail.com", initials: "IK", role: "Technician", joined: "30 Apr 2026", bookings: 96, status: "Banned" },
  { id: "u7", name: "Rumana Parvin", email: "rumana@mail.com", initials: "RP", role: "Customer", joined: "02 Jul 2026", bookings: 1, status: "Active" },
  { id: "u8", name: "Milon Sheikh", email: "milon@mail.com", initials: "MS", role: "Technician", joined: "15 Feb 2026", bookings: 415, status: "Active" },
  { id: "u9", name: "Sabbir Ahmed", email: "sabbir@mail.com", initials: "SA", role: "Customer", joined: "21 May 2026", bookings: 7, status: "Active" },
  { id: "u10", name: "Farhana Islam", email: "farhana@mail.com", initials: "FI", role: "Technician", joined: "11 Dec 2025", bookings: 590, status: "Active" },
  { id: "u11", name: "Nayeem Islam", email: "nayeem@mail.com", initials: "NI", role: "Customer", joined: "08 Jul 2026", bookings: 2, status: "Active" },
  { id: "u12", name: "Tanvir Chowdhury", email: "tanvir@mail.com", initials: "TC", role: "Technician", joined: "19 Mar 2026", bookings: 128, status: "Suspended" },
  { id: "u13", name: "Tasnim Jahan", email: "tasnim@mail.com", initials: "TJ", role: "Customer", joined: "27 Jun 2026", bookings: 5, status: "Active" },
  { id: "u14", name: "Sohel Mia", email: "sohel@mail.com", initials: "SM", role: "Technician", joined: "05 May 2026", bookings: 233, status: "Active" },
  { id: "u15", name: "Kamrul Hasan", email: "kamrul@mail.com", initials: "KH", role: "Customer", joined: "14 Apr 2026", bookings: 9, status: "Active" },
  { id: "u16", name: "Jubayer Rahman", email: "jubayer@mail.com", initials: "JR", role: "Technician", joined: "23 Feb 2026", bookings: 340, status: "Active" },
  { id: "u17", name: "Shirin Akter", email: "shirin@mail.com", initials: "SA", role: "Customer", joined: "31 May 2026", bookings: 4, status: "Active" },
  { id: "u18", name: "Rafiq Uddin", email: "rafiq@mail.com", initials: "RU", role: "Customer", joined: "16 Jul 2026", bookings: 1, status: "Active" },
]

export const ADMIN_CATEGORIES_SEED: AdminCategory[] = [
  { id: "c1", name: "Plumbing", slug: "plumbing", icon: "🔧", jobs: 1284, services: 2, active: true },
  { id: "c2", name: "Electrical", slug: "electrical", icon: "⚡", jobs: 1102, services: 2, active: true },
  { id: "c3", name: "AC & Cooling", slug: "ac", icon: "❄️", jobs: 968, services: 2, active: true },
  { id: "c4", name: "Appliance Repair", slug: "appliance", icon: "🔌", jobs: 741, services: 2, active: true },
  { id: "c5", name: "Carpentry", slug: "carpentry", icon: "🪚", jobs: 620, services: 2, active: true },
  { id: "c6", name: "Painting", slug: "painting", icon: "🎨", jobs: 512, services: 2, active: true },
  { id: "c7", name: "Deep Cleaning", slug: "cleaning", icon: "🧹", jobs: 889, services: 2, active: true },
  { id: "c8", name: "Pest Control", slug: "pest", icon: "🐛", jobs: 304, services: 2, active: false },
]

/** Top 6 by jobs for overview rank list */
export const BUSIEST_CATEGORIES = [
  { name: "Plumbing", jobs: 1284 },
  { name: "Electrical", jobs: 1102 },
  { name: "AC & Cooling", jobs: 968 },
  { name: "Deep Cleaning", jobs: 889 },
  { name: "Appliance Repair", jobs: 741 },
  { name: "Carpentry", jobs: 620 },
]

export const ADMIN_STATUS_COUNTS: { status: BookingStatus; count: number }[] = [
  { status: "REQUESTED", count: 92 },
  { status: "ACCEPTED", count: 148 },
  { status: "PAID", count: 310 },
  { status: "IN_PROGRESS", count: 84 },
  { status: "COMPLETED", count: 540 },
  { status: "CANCELLED", count: 21 },
  { status: "DECLINED", count: 9 },
]

export const GROSS_MONTHS = [
  { label: "Feb", value: 182 },
  { label: "Mar", value: 246 },
  { label: "Apr", value: 214 },
  { label: "May", value: 308 },
  { label: "Jun", value: 372 },
  { label: "Jul", value: 441 },
]

export const DECISION_QUEUE = [
  {
    id: "d1",
    title: "Refund dispute · FIX-4698",
    detail: "Customer says the crew never arrived. Technician disagrees.",
    tag: "Urgent",
    tone: "urgent" as const,
  },
  {
    id: "d2",
    title: "Verification · Milon Sheikh",
    detail: "Trade licence uploaded, waiting on manual review.",
    tag: "Pending",
    tone: "pending" as const,
  },
  {
    id: "d3",
    title: "Category request · Solar install",
    detail: "Four technicians asked for this category to be added.",
    tag: "New",
    tone: "new" as const,
  },
  {
    id: "d4",
    title: "Repeat cancellation · Tanvir C.",
    detail: "Third late cancellation in 30 days. Suspension suggested.",
    tag: "Review",
    tone: "review" as const,
  },
]

export const BAN_REASONS = [
  "Repeated no-shows",
  "Fraudulent payment activity",
  "Abusive behaviour toward a customer",
  "Fake verification documents",
] as const

export function formatTaka(n: number) {
  return `৳${n.toLocaleString("en-IN")}`
}

export function formatTakaK(n: number) {
  return `৳${(n * 1000).toLocaleString("en-IN")}`
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function iconFromSlug(slug: string): string {
  const s = slug.toLowerCase()
  if (s.includes("plumb") || s.includes("pipe")) return "🔧"
  if (s.includes("electr") || s.includes("bolt")) return "⚡"
  if (s.includes("ac") || s.includes("cool") || s.includes("hvac")) return "❄️"
  if (s.includes("appliance")) return "🔌"
  if (s.includes("carpent") || s.includes("wood") || s.includes("saw"))
    return "🪚"
  if (s.includes("paint")) return "🎨"
  if (s.includes("clean")) return "🧹"
  if (s.includes("pest") || s.includes("bug")) return "🐛"
  if (s.includes("solar") || s.includes("tool")) return "🛠️"
  if (s.includes("mov") || s.includes("box")) return "📦"
  if (s.includes("home")) return "🏠"
  return "🔧"
}

export function lifetimeValue(bookings: number) {
  return bookings * 1150
}
