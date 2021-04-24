// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import type { NextApiRequest, NextApiResponse } from "next";
const BOOKS_ROUTE = "https://readwise.io/api/v2/books/";
const HIGHLIGHTS_ROUTE = "https://readwise.io/api/v2/highlights";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const token = req.query.token;
  if (token && typeof token === "string") {
    const highlight = await getHighlights(token);
    res.setHeader("Cache-Control", "public, max-age=360000");
    res.setHeader("Expires", new Date(Date.now() + 360000).toUTCString());
    res.status(200).json(highlight);
  }
  res.status(400).json({ error: "Missing READWISE token query param" });
};

async function getBooks(token: string) {
  return fetch(BOOKS_ROUTE, {
    method: "Get",
    mode: "cors",
    headers: {
      Authorization: `TOKEN ${token}`,
    },
  })
    .then((res) => res.json())
    .then((res) => {
      return res.results.map((x) => {
        return { id: x.id, cover_image_url: x.cover_image_url };
      });
    });
}

async function getRandomBook(token: string) {
  return getBooks(token).then((books) => {
    const randomBook = books[Math.floor(Math.random() * books.length)];
    return randomBook;
  });
}
async function getHighlights(token: string) {
  const randomBook = await getRandomBook(token);
  return fetch(
    `${HIGHLIGHTS_ROUTE}?${new URLSearchParams({ book_id: randomBook.id })}`,
    {
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: `TOKEN ${token}`,
        contentType: "application/json",
      },
    }
  )
    .then((res) => res.json())
    .then((res) => {
      if (res.count > 0) {
        const randomQuote =
          res.results[Math.floor(Math.random() * res.results.length)].text;

        const selectedQuote = {
          quote: randomQuote,
          cover: randomBook.cover_image_url,
        };
        return selectedQuote;
      }
    })
    .catch((e) => console.log(e));
}
