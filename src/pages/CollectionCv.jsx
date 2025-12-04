import { useParams } from "react-router-dom";

function CollectionCv() {
  const { major } = useParams();
  return (
    <div className="h-screen grid place-items-center">
      <h1 className="text-center">
        Bu yerda <span className="bg-warning text-warning-conten">{major}</span>{" "}
        yo'nalishga ma'lumot to'ldirgan kondidatlar ro'yxati bo'ladi.
      </h1>
    </div>
  );
}

export default CollectionCv;
