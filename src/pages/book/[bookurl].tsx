import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from 'next/router'
import { useState } from "react";
import { requireAuth } from "../../common/requireAuth";
import { trpc } from "../../common/trpc";
import { prisma } from "../../server/prisma";
import Layout from "../../components.tsx/Layout";
import StarRating from "../../components.tsx/StarRating";
import Image from "next/image";
import Reviews from "../../components.tsx/Reviews";
import WriteAReview from "../../components.tsx/WriteAReview";
import OverviewCard from "../../components.tsx/OverviewCard";

export const getServerSideProps = requireAuth(async (ctx) => {
  // check if the the url parameter are a book in the database
  const Book = await prisma.book.findFirst({
    where: {
      book_url: String(ctx.params?.bookurl)
    },
    select: {
      id: true,
      synopsis: true,
      author: true,
      image_url: true,
      name: true,
    }
  })
  if (!Book) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };
  }


  return { props: { synopsis: Book.synopsis, name: Book.name, author: Book.author, image_url: Book.image_url } }; //TODO: Add reviews here
});

type bookProps = {
  synopsis: string;
  name: string;
  image_url: string;
  author: string;
};

const Book: NextPage<bookProps> = (props: bookProps) => {
  const session = useSession();
  const { bookurl, ...tags } = useRouter().query
  const book_url = String(bookurl)

  //setting the state of the button according to user's 
  const [ButtonState, setButtonState] = useState({ text: "Loading...", disabled: true, shouldAdd: true })
  const [RatingState, setRatingState] = useState({ rating: NaN, disabled: true })
  const [ReviewState, setReviewState] = useState({ review: "Loading...", disabled: true })

  //Initial set up for stateful components
  const { data, refetch } = trpc.fetchSingleBookDataByUrl.useQuery({ book_url })

  const reviews_data_formatted = data?.result?.Users.map((user: { Rating: any; Review: any; user: { username: any; }; assignedAt: any; }) => { return { rating: user.Rating, review: user.Review, name: user.user.username, date: user.assignedAt } })

  const fetch_result = trpc.fetchBookFromLibrary.useQuery({ book_url, data: session.data }, {
    onSuccess: async (newData) => {   // Having a cache that isn't being used you get a performance boost
      if (newData.exists) {
        setButtonState({ text: "Remove from Library", disabled: false, shouldAdd: false })
        setRatingState({ rating: Number(newData.result?.Rating), disabled: false })
        setReviewState({ review: String(newData.result?.Review), disabled: false })
      } else {
        setButtonState({ text: "Add to Library", disabled: false, shouldAdd: true })
        setRatingState({ rating: NaN, disabled: true })
        setReviewState({ review: "Add to Library first.", disabled: true })
      }
    }
  })

  const mutationAddtoLib = trpc.addToBookLibrary.useMutation()
  const mutationremoveFromLib = trpc.removeBookFromLibrary.useMutation()
  const mutationAddRating = trpc.addBookRating.useMutation()
  const mutationAddReview = trpc.addBookReview.useMutation()

  //disables rating 
  const handleLibraryOnClick = async () => {
    setButtonState({ text: ButtonState.text, disabled: true, shouldAdd: ButtonState.shouldAdd })
    setRatingState({ rating: RatingState.rating, disabled: true })
    setReviewState({ review: ReviewState.review, disabled: true })

    if (ButtonState.shouldAdd) {
      mutationAddtoLib.mutate({ book_url }, {
        onSuccess: async (newData) => {
          setButtonState({ text: "Remove from Library", disabled: false, shouldAdd: false })
          setRatingState({ rating: RatingState.rating, disabled: false })
          setReviewState({ review: ReviewState.review, disabled: false })
          refetch()
        },
      });
    } else {
      mutationremoveFromLib.mutate({ book_url }, {
        onSuccess: async (newData) => {
          setButtonState({ text: "Add to Library", disabled: false, shouldAdd: true })
          setRatingState({ rating: NaN, disabled: true })
          setReviewState({ review: ReviewState.review, disabled: true })
          refetch()
        }
      });
    }
  };

  const handleRatingOnClick = async (rating: number) => {
    setRatingState({ rating, disabled: true })
    mutationAddRating.mutate({ book_url, rating }, {
      onSuccess: async (newData) => {
        setRatingState({ rating: newData.rating, disabled: false })
        refetch()
      }
    })
  }

  const handleReviewOnSubmit = async (review: string) => {
    setReviewState({ review, disabled: true })
    mutationAddReview.mutate({ book_url, review }, {
      onSuccess: async (newData) => {
        setReviewState({ review: newData.review, disabled: false })
        refetch()
      }
    })
  }


  return (
    <Layout>
      <div className="p-3 mb-2 bg-primary text-white"><h1>Single Books Page</h1>Here is where you can all the information about a single book and rate them</div>
      <div className="center-flex">

        <div className="page-size center-flex">

          <div className="card mb-5 mt-1 font_set shadow rounded p-3">
            <div className="center-flex">
              <h5 className="card-title">{props.name} by {props.author}</h5>
              <StarRating rating={RatingState.rating}
                disabled={RatingState.disabled}
                onClick={handleRatingOnClick} />
            </div>

            <div className="card_body mt-3">
              <div>
                <div className="mb-3 center-flex">
                  <div className="image_size">
                    <Image src={"/images/books/" + props.image_url + ".jpg"} className="img-fluid rounded" width={255} height={500} alt="..."></Image>
                  </div>
                    {<button className="button-size m-3"
                      onClick={() => handleLibraryOnClick()}
                      disabled={ButtonState.disabled}>{ButtonState.text}</button>}
                  </div>
                <div className="error-message">{(mutationAddtoLib.error || mutationremoveFromLib.error)
                  && <p>Something went wrong! {mutationAddtoLib.error?.message}
                    or {mutationremoveFromLib.error?.message}</p>}
                </div>
              </div>

              <div className="p-1 w-75">
                <div className="text-component">
                  <p className="card-text">{props.synopsis}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card mb-5 mt-1 font_set shadow rounded p-3 review-section">
            <div className="center-flex">
              <div className="review-section-inner">
                <div className="center-flex">
                  <h3>Write a review</h3>
                </div>
                <WriteAReview review={ReviewState.review} onSubmit={handleReviewOnSubmit} disabled={ReviewState.disabled} />
                <div className="center-flex mt-3">
                  <h3> Reviews </h3>
                </div>
                {reviews_data_formatted?.map((review: { name: string; review: string; date: Date | null; rating: number | null; }, i) => {
                  return <Reviews key={i} by={review.name} review={review.review} date={review.date} rating={review.rating} />
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>
        {
          `
              .card_body {
                display: flex;
              }
              .image_size {
                width: min(50%,200px);
              }
              .font_set {
                font-size: clamp(0.8rem, 0.5vw + 0.5rem, 1.0rem);
              }
              .text-component {
                height: 300px;
                overflow: scroll;
              }
              .center-flex {
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .button-size {
                width: min(50%,200px);
              }
              .page-size {
                width: min(100%, 1200px);
              }
              .review-section {
                width: min(100%, 1200px);
              }
              .review-section-inner {
                width: min(100%, 1200px);
              }
          `
        }
      </style>
    </Layout>
  );
};

export default Book;
