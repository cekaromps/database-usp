import { prisma } from "@/lib/prisma";

const CUSTOMER_DATA: Record<string, { code: string; address: string }> = {
  "PT OSI": {
    code: "001",
    address:
      "Cammo Industrial Park Blok B2 No. 3A Batam Center Batam - Indonesia",
  },
  "PT ALCOTRAINDO BATAM": {
    code: "006",
    address: "Citra Buana III Lot 40 C, Batam Center  Indonesia 29400",
  },
  "PT NOK FREDEUNBERG BATAM": {
    code: "024",
    address:
      "Jln. Rambutan Lot 501/501A , 502/502A Batamindo Industrial Park Mukakuning, Batam 29433",
  },
  "PT AMTEK RE-ENGINEERING": {
    code: "029",
    address:
      "Jln. Letjen Soeprapto, Cammo Industrial Park Block E No. 1 Batam Center 29432",
  },
  "PT CLADTEK": { code: "034", address: "Jln Tenggiri - Batu Ampar" },
  "PT ANUGERAH SAHABAT MARINE": {
    code: "081",
    address: "Executive Industrial Park Blok B1 no 3 Batam Center",
  },
  "PT RAAJRATNA": {
    code: "036",
    address: "Tunas Industrial Estate Block 8D & 8E Batam - Indonesia ",
  },
  "PT ALTECO CHEMICAL": {
    code: "043",
    address: "Jl. Angsana Lot 286 & 287 BIP Muka Kuning Batam - Indonesia",
  },
  "PT DYNACAST INDONESIA": {
    code: "078",
    address:
      "Jalan Rambutan, Lot 517, Batamindo Industrial Park Mukakuning , Batam - Indonesia",
  },
  "PT INDO KREASI GRAFIKA": {
    code: "092",
    address: "Tunas Industrial Estate, Lot 1 - H, Belian ",
  },
  "CV. CILINTON BARAT": {
    code: "093",
    address: "Komplek Legenda Gemilang A No. 8 Batam - Indonesia",
  },
  "PT BROADFAR INDONESIA": {
    code: "098",
    address: "Kawasan Industri tunas Kabil Batam Kepri - Indonesia",
  },
  "PT PECM INDONESIA": { code: "096", address: "Tanjung Uncang, Batam" },
  "PT LABROY": {
    code: "103",
    address:
      "Jalan Patimura RT.001/RW.001, Telaga Punggur, Kelurahan Kabil, Kecamatan Nongsa Batam Kepualauan Riau - Indonesia",
  },
  "PT WAHANA TIRTA MILENIA": {
    code: "106",
    address:
      "Jl. Hang Kesturi IV No. 29 Batu Besar, Nongsa Batam Kepulauan Riau 29466",
  },
  "PT. BATAM NIAGA": {
    code: "107",
    address:
      "Komp. Citra Buana Industrial Park I Jl. Yos Sudarso Blok A No 6 Kp. Pelita  Kec. Lubuk Baja Kota Batam Kepulauan Riau 29432 Indonesia ",
  },
  "PT TSI SMART PRODUCTS": {
    code: "108",
    address:
      "Panbil Industrial estate block E lot 6 - 9 Kota Batam     Kepulauan Riau 29443",
  },
  "PT. BLUE OCEAN LABS": {
    code: "109",
    address:
      "Kompleks Sarana Industri Point Blok D No 7 & 8 Kepulauan Riau 29422 Indonesia ",
  },
  "PT. BEC": {
    code: "110",
    address:
      "Komp. Sarana Industrial Point Blok E No. 05 Batam Center, Pulau Batam 29432",
  },
  "PT. INDO KREASI GRAFIKA": {
    code: "092",
    address: "Tunas Industrial Estate, Lot 1 - H, Belian ",
  },
  "PT. KANGLY BATAM": {
    code: "062",
    address: "Kawasan Industri Tunas 2 Block 1C, Batam Center",
  },
  "INSTITUT TEKNOLOGI BATAM": {
    code: "098",
    address:
      "The Vitka City Complex, Tiban, Jl. Gajah Mada,Kota Batam, Kepulauan Riau",
  },
};
async function main() {
  console.log("Start seeding");

  const customerEntries = Object.entries(CUSTOMER_DATA).map(
    ([name, details]) => ({
      code: details.code,
      name: name,
      address: details.address,
    }),
  );

  for (const customer of customerEntries) {
    await prisma.customer.upsert({
      where: { code: customer.code },
      update: {
        name: customer.name,
        address: customer.address,
      },
      create: {
        code: customer.code,
        name: customer.name,
        address: customer.address,
      },
    });

    console.log("Seeding finished");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
