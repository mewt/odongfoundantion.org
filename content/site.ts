import photos from "./photos.json";
export { photos };

export const site = {
  name: "ODONG Foundation",
  legalName: "Yayasan Odong Prestasi Indonesia",
  logo: "/img/logo/Logo Yayasan Odong Prestasi Indonesia.png",
  hero: photos.hero.url,
  email: "putri@odongfoundation.org",
  phone: "0822-4772-3858",
  whatsapp: "6282247723858",
  address: "Jl. Kemang Utara 33 No.3, Lantai 2, Kelurahan Bangka, Mampang Prapatan, Jakarta Selatan, DKI Jakarta 12730",
  instagram: "https://www.instagram.com/odong.foundation/",
  youtube: "https://www.youtube.com/@YayasanOdongFoundation",
  accounts: [
    { bank: "CCB", number: "2004487888", branch: "Cabang Ketapang" },
    { bank: "Bank Ganesha", number: "2300131417", branch: "Cabang Mangga Dua" },
  ],
};

export const programs = [
  {
    key: "league", id: "odong-league", title: "Odong League",
    image: "/img/foto2/Dok Odong League/20240810_135942386_iOS.webp",
    partners: ["Garudaku", "PBESI"],
  },
  {
    key: "campus", id: "mycampus-league", title: "MyCampus League",
    image: "/img/foto2/Dok Mycampus/3 mycampusleague.png",
    partners: ["US Mission", "American Spaces"],
  },
  {
    key: "academy", id: "leadership-academy", title: "Sport Leadership Academy",
    image: "/img/foto2/Dok mini turney/1 kegiatan mei.png",
    partners: ["US Mission", "NASEF", "Garudaku", "American Spaces"],
  },
] as const;

export const partners: { name: string; label: string; image: string; url?: string }[] = [
  { name: "US Mission", label: "U.S. Embassy", image: "/img/logo/US Mission Logo_Black Text.png" },
  { name: "American Spaces", label: "American Spaces Indonesia", image: "/img/logo/American Spaces Indonesia Logo.png", url: "https://atamerica.or.id/id/beranda/" },
  { name: "Garudaku", label: "Akademi Garudaku", image: "/img/logo/Logo Garudaku_Black Text.png", url: "https://garudaku.com/" },
  { name: "PBESI", label: "PBESI", image: "/img/logo/Logo PBESI.png" },
  { name: "NASEF", label: "NASEF", image: "/img/logo/1b47f6d-f86-cca-52-440085bee4d_Network_of_Academic_and_Scholastic_Esports_Federations_Orange_2x.png", url: "https://www.nasef.org/" },
];

export const gallery = [
  { image: "/img/foto2/Dok Odong League/20240810_135942386_iOS.webp", key: "item1" },
  { image: "/img/foto2/Dok Odong League/20240810_165017434_iOS.webp", key: "item2" },
  { image: "/img/foto2/Dok Mycampus/3 mycampusleague.png", key: "item3" },
  { image: "/img/foto2/Dok Mycampus/4 mycampusleague.png", key: "item4" },
  { image: "/img/foto2/Dok mini turney/2 kegiatan mei.png", key: "item5" },
  { image: "/img/foto2/Dok mini turney/5 kegiatan mei.png", key: "item6" },
];
