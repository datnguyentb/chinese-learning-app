export type ToneNumber = 1 | 2 | 3 | 4 | 5;

export type ToneSample = {
  id: string;
  hanzi: string;
  pinyin: string;
  vi: string;
  tone: ToneNumber;
};

export type ToneSet = {
  id: string;
  title: string;
  samples: ToneSample[];
};

export const toneSets: ToneSet[] = [
  {
    id: "ma",
    title: "ma — bộ thanh cơ bản",
    samples: [
      { id: "ma1", hanzi: "妈", pinyin: "mā", vi: "mẹ", tone: 1 },
      { id: "ma2", hanzi: "麻", pinyin: "má", vi: "tê, gai", tone: 2 },
      { id: "ma3", hanzi: "马", pinyin: "mǎ", vi: "ngựa", tone: 3 },
      { id: "ma4", hanzi: "骂", pinyin: "mà", vi: "mắng", tone: 4 },
      { id: "ma5", hanzi: "吗", pinyin: "ma", vi: "trợ từ hỏi", tone: 5 },
    ],
  },
  {
    id: "ba",
    title: "ba",
    samples: [
      { id: "ba1", hanzi: "八", pinyin: "bā", vi: "tám", tone: 1 },
      { id: "ba2", hanzi: "拔", pinyin: "bá", vi: "nhổ", tone: 2 },
      { id: "ba3", hanzi: "把", pinyin: "bǎ", vi: "cầm", tone: 3 },
      { id: "ba4", hanzi: "爸", pinyin: "bà", vi: "bố", tone: 4 },
      { id: "ba5", hanzi: "吧", pinyin: "ba", vi: "trợ từ gợi ý", tone: 5 },
    ],
  },
  {
    id: "tang",
    title: "tang",
    samples: [
      { id: "tang1", hanzi: "汤", pinyin: "tāng", vi: "canh", tone: 1 },
      { id: "tang2", hanzi: "糖", pinyin: "táng", vi: "đường", tone: 2 },
      { id: "tang3", hanzi: "躺", pinyin: "tǎng", vi: "nằm", tone: 3 },
      { id: "tang4", hanzi: "烫", pinyin: "tàng", vi: "nóng bỏng", tone: 4 },
    ],
  },
];

export const toneSamples = toneSets.flatMap((set) => set.samples);
