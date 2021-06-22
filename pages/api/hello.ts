// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import type { NextApiRequest, NextApiResponse } from "next";
import cacheData from "memory-cache";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HIGHLIGHTS_ROUTE = "https://readwise.io/api/v2/highlights";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const token = req.query.token;
  if (token && typeof token === "string") {
    const highlight = await getHighlights(token);
    res.setHeader("Cache-Control", "public, max-age=360000");
    res.setHeader("Expires", new Date(Date.now() + 360000).toUTCString());
    res.status(200).json(highlight);
  } else {
    res.status(400).json({ error: "Missing READWISE token query param" });
  }
};

function getHeaders(token: string) {
  return {
    method: "GET",
    mode: "cors" as RequestMode,
    headers: {
      Authorization: `TOKEN ${token}`,
      contentType: "application/json",
    },
  };
}
async function getBookById(bookId: string, token: string) {
  return fetch(
    `https://readwise.io/api/v2/books/${bookId}`,
    getHeaders(token)
  ).then((res) => res.json());
}

async function getHighlights(token: string) {
  const numHighlights = cacheData.get(token);
  if (numHighlights) {
    const randomQuoteIdx = Math.floor(Math.random() * numHighlights);
    return fetch(
      `${HIGHLIGHTS_ROUTE}?${new URLSearchParams({
        page_size: "1",
        page: randomQuoteIdx.toString(),
      })}`,
      getHeaders(token)
    )
      .then((res) => res.json())
      .then(async (res) => {
        const bookId = res.results[0].book_id;
        const book = await getBookById(bookId, token);
        const selectedQuote = {
          quote: res.results[0].text,
          title: book.title,
          cover: book.cover_image_url,
        };
        return selectedQuote;
      });
  } else {
    return fetch(
      `${HIGHLIGHTS_ROUTE}?${new URLSearchParams({
        page_size: "1",
        page: "1",
      })}`,
      getHeaders(token)
    )
      .then((res) => res.json())
      .then(async (res) => {
        cacheData.put(token, res.count, DAY_IN_MS);
        const randomQuoteIdx = Math.floor(Math.random() * res.count);
        return await fetch(
          `${HIGHLIGHTS_ROUTE}?${new URLSearchParams({
            page_size: "1",
            page: randomQuoteIdx.toString(),
          })}`,
          getHeaders(token)
        )
          .then((res) => res.json())
          .then((res) => {
            const selectedQuote = {
              quote: res.results[0].text,
            };
            return selectedQuote;
          });
      })
      .catch((e) => console.log(e));
  }
}
