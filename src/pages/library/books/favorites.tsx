import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import router from "next/router";
import { useState } from "react";
import { requireAuth } from "../../../common/requireAuth";
import { trpc } from "../../../common/trpc";
import OverviewCard from "../../../components.tsx/OverviewCard";
import Layout from "../../../components.tsx/Layout";
import CustomTextComponent from "../../../components.tsx/CustomTextComponent";

export const getServerSideProps = requireAuth(async (ctx) => {
  return { props: {} };
});

// The page that you only see if the authentication is successful, we could revamp this page to only should non-sensistive information still the login occurs if we used 
const Dashboard: NextPage = () => {
  const { data } = useSession();
  const [searchKeyword, setSearchKeyword] = useState("")

  const AllBookInLibrarySortedRecentFav = trpc.AllBookInLibrarySortedRecentFav.useQuery({ 
    keyword: searchKeyword, 
    take : 15, 
    data }, { 
      onSuccess: async (newData) => {
    }
  })
  const FavoritesArray = AllBookInLibrarySortedRecentFav.data?.result

  return ( //TODO: remove tailwind css and add your own
    <Layout>
      <div className="">
        <div className="">
          <div className="">
          <div className="p-3 mb-2 bg-primary text-white" onClick={() => {router.push("/library/books/")}}>
            <h1>{data?.user.username}&apos;s Library Page</h1>Here is your library where you can see your book collection!
          </div>
          <div  className="p-3 mb-2 bg-secondary text-white" 
                onClick={() => {router.push("/library/books/favorites")}}>
              <h3>Favorites</h3>
          </div>
          <div className="form-outline">
                <input 
                  type="search" 
                  id="form1" 
                  className="form-control" 
                  placeholder="Search your favorites" 
                  aria-label="Search" 
                  onChange={(e) => {setSearchKeyword(e.target.value)}} />
          </div>
                { 
                 !(FavoritesArray?.length === 0) ? 
                 <div className="cards">
                   {FavoritesArray?.map((input, i) => {
                    return <OverviewCard 
                              key={i} 
                              name={input.book.name} 
                              type="books" 
                              rating={input.Rating} 
                              by={input.book.author} 
                              synopsis={input.book.synopsis} 
                              date={input.assignedAt} 
                              image_url={input.book.image_url} 
                              media_url={input.book.book_url}/>
                            
                            })}
                 </div>
                :   
                  <CustomTextComponent message="No Books found!"/> }
        </div>
      </div>
    </div>
    <style jsx>
      {`
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(399px, 100%), 1fr));
      }
      `}
    </style>
  </Layout>
  );
};

export default Dashboard;
