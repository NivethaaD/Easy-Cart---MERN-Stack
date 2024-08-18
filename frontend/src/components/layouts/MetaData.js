import {Helmet, helmet} from "react-helmet-async"

export default function MetaData({title}){
    return(

        <Helmet>
            <title>{`${title} - EasyCart`}</title>
        </Helmet>
    )

}